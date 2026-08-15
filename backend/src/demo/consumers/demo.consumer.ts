import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  DEMO_REFRESH_QUEUE,
  REFRESH_DEMO_TRACKS_JOB,
  JobNames,
} from '../../consts';
import { format } from 'date-fns';
import { TZDate } from '@date-fns/tz';
import { DEMO_REFRESH_CRON, DEMO_REFRESH_TZ } from '../demo.constants';
import { DemoService } from '../services/demo.service';
import { AppLoggerService } from '../../logger/logger.service';

@Processor(DEMO_REFRESH_QUEUE)
export class DemoConsumer extends WorkerHost implements OnModuleInit {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectQueue(DEMO_REFRESH_QUEUE) private readonly queue: Queue,
    private readonly demoService: DemoService,
    appLogger: AppLoggerService,
  ) {
    super();
    this.logger = appLogger.child(DemoConsumer.name);
  }

  async onModuleInit() {
    await this.queue.add(
      REFRESH_DEMO_TRACKS_JOB,
      {},
      {
        repeat: { pattern: DEMO_REFRESH_CRON, tz: DEMO_REFRESH_TZ },
        jobId: REFRESH_DEMO_TRACKS_JOB,
      },
    );

    if (await this.demoService.needsSeeding()) {
      this.logger.log('Demo pool needs seeding; running a refresh now');
      const today = format(
        new TZDate(new Date(), DEMO_REFRESH_TZ),
        'yyyy-MM-dd',
      );
      await this.queue.add(
        REFRESH_DEMO_TRACKS_JOB,
        {},
        {
          jobId: `${REFRESH_DEMO_TRACKS_JOB}-seed-${today}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    }
  }

  async process(job: Job<Record<string, never>, void, string>): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case REFRESH_DEMO_TRACKS_JOB:
        await this.demoService.refreshAll();
        break;

      default:
        this.logger.warn(`Unknown job name: ${jobName}`);
    }
  }
}
