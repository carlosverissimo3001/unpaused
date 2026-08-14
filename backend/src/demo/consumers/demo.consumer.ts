import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  DEMO_REFRESH_QUEUE,
  REFRESH_DEMO_TRACKS_JOB,
  JobNames,
} from '../../consts';
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
        repeat: { pattern: '0 8 * * *', tz: 'Europe/Lisbon' },
        jobId: REFRESH_DEMO_TRACKS_JOB,
      },
    );

    // A repeatable job does not run on registration, so a fresh database would
    // serve nothing until 08:00. Seed it once instead.
    if (await this.demoService.isEmpty()) {
      this.logger.log('Demo pool is empty; seeding now');
      // A fixed jobId keeps restarts, and multiple replicas, from each
      // enqueueing their own full scrape.
      await this.queue.add(
        REFRESH_DEMO_TRACKS_JOB,
        {},
        { jobId: `${REFRESH_DEMO_TRACKS_JOB}-seed` },
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
