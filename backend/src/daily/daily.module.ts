import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@prisma/prisma.module';
import { DAILY_TRACK_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from '../consts';
import { PoolModule } from '../pool/pool.module';
import { TrackModule } from '../track/track.module';
import { DailyTrackRepository } from './repositories/daily-track.repository';
import { DailyTrackService } from './services/daily-track.service';
import { DailyTrackConsumer } from './consumers/daily-track.consumer';

@Module({
  imports: [
    PrismaModule,
    PoolModule,
    TrackModule,
    BullModule.registerQueue({
      name: DAILY_TRACK_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  providers: [DailyTrackRepository, DailyTrackService, DailyTrackConsumer],
  exports: [DailyTrackService],
})
export class DailyModule {}
