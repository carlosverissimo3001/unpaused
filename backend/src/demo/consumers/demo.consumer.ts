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

    // A repeatable job does not run on registration, so a fresh database would
    // serve nothing until 08:00. Seed it once instead.
    if (await this.demoService.needsSeeding()) {
      this.logger.log('Demo pool needs seeding; running a refresh now');
      // The id dedupes concurrent boots and replicas, and then gets out of the
      // way: add() is ignored while an id exists, and completed jobs are
      // retained for days, so without removeOnComplete a second seed on the
      // same day is swallowed. That is not hypothetical: a deploy that adds a
      // table needs a fresh seed hours after the first one ran, and it silently
      // did not get one.
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
