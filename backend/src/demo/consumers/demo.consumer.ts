import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  DEMO_REFRESH_QUEUE,
  REFRESH_DEMO_TRACKS_JOB,
  JobNames,
} from '../../consts';
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
      // Run it directly rather than through the queue. Seeding is a one-shot
      // boot task, and every attempt to express "only once" as a job id has
      // failed the same way: add() is ignored while that id exists, completed
      // jobs are retained, and the seed is silently swallowed. A fixed id
      // swallowed every later seed; a dated one swallowed the second seed of
      // the day, which is exactly what a deploy adding a table needs.
      //
      // refreshAll is idempotent, replacePlaylist being a full replace inside
      // a transaction, so a second replica running it costs a duplicate fetch
      // and nothing else. Not awaited: seeding must not hold up boot.
      this.logger.log('Demo pool needs seeding; refreshing now');
      void this.demoService
        .refreshAll()
        .catch((error: Error) =>
          this.logger.error(`Seed refresh failed: ${error.message}`),
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
