import { OnModuleInit } from '@nestjs/common';
import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  GAME_CLEANUP_QUEUE,
  CLEAN_UP_ABANDONED_GAMES_JOB,
  JobNames,
} from '../../consts';
import { GameService } from '../services/game.service';

@Processor(GAME_CLEANUP_QUEUE)
export class GameConsumer extends WorkerHost implements OnModuleInit {
  constructor(
    @InjectQueue(GAME_CLEANUP_QUEUE) private queue: Queue,
    private readonly gameService: GameService,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.add(
      CLEAN_UP_ABANDONED_GAMES_JOB,
      {},
      {
        repeat: {
          pattern: '0 * * * *', // Every hour
        },
        jobId: CLEAN_UP_ABANDONED_GAMES_JOB,
      },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async process(job: Job<any, any, string>): Promise<void> {
    const jobName = job.name as JobNames;

    switch (jobName) {
      case CLEAN_UP_ABANDONED_GAMES_JOB:
        await this.gameService.cleanupAbandonedGames();
        break;

      default:
        console.warn(`Unknown job name: ${jobName}`);
    }
  }
}
