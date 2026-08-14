import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RedisModule } from '@redis/redis.module';
import { PrismaModule } from '@prisma/prisma.module';
import { DEMO_REFRESH_QUEUE, JOB_OPTIONS_WITH_BACKOFF } from '../consts';
import { DemoController } from './controllers/demo.controller';
import { DemoService } from './services/demo.service';
import { DemoPlaylistService } from './services/demo-playlist.service';
import { DemoTrackRepository } from './repositories/demo-track.repository';
import { DemoConsumer } from './consumers/demo.consumer';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    BullModule.registerQueue({
      name: DEMO_REFRESH_QUEUE,
      defaultJobOptions: JOB_OPTIONS_WITH_BACKOFF,
    }),
  ],
  controllers: [DemoController],
  providers: [
    DemoService,
    DemoPlaylistService,
    DemoTrackRepository,
    DemoConsumer,
  ],
})
export class DemoModule {}
