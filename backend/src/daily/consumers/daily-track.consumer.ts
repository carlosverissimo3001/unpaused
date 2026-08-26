import { OnModuleInit } from '@nestjs/common';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import {
  DAILY_TRACK_QUEUE,
  FILL_DAILY_TRACK_JOB,
  JobNames,
} from '../../consts';
import { DAILY_TRACK_FILL_CRON, DAILY_TRACK_FILL_TZ } from '../consts';
import { DailyTrackService } from '../services/daily-track.service';
import { AppLoggerService } from '../../logger/logger.service';

@Processor(DAILY_TRACK_QUEUE)
export class DailyTrackConsumer extends WorkerHost implements OnModuleInit {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectQueue(DAILY_TRACK_QUEUE) private readonly queue: Queue,
    private readonly dailyTrackService: DailyTrackService,
    appLogger: AppLoggerService,
  ) {
    super();
    this.logger = appLogger.child(DailyTrackConsumer.name);
  }

  async onModuleInit() {
    await this.queue.add(
      FILL_DAILY_TRACK_JOB,
      {},
      {
        repeat: { pattern: DAILY_TRACK_FILL_CRON, tz: DAILY_TRACK_FILL_TZ },
        jobId: FILL_DAILY_TRACK_JOB,
      },
    );

    // A first deploy, or a night the job missed: today has to exist before
    // anyone asks for it, and the answer is the same whichever instance wins.
    if (!(await this.dailyTrackService.hasToday())) {
      this.logger.log('No daily track for today; filling now');
      void this.dailyTrackService
        .today()
        .catch((error: Error) =>
          this.logger.error(`Daily fill failed: ${error.message}`),
        );
    }
  }

  async process(job: Job<Record<string, never>, void, string>): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case FILL_DAILY_TRACK_JOB:
        await this.dailyTrackService.fillTomorrow();
        break;

      default:
        this.logger.warn(`Unknown job name: ${jobName}`);
    }
  }
}
