import { Module } from '@nestjs/common';
import { RedisModule } from '@redis/redis.module';
import { TrackModule } from '../track/track.module';
import { PoolModule } from '../pool/pool.module';
import { GuestGameController } from './controllers/guest-game.controller';
import { GuestGameService } from './services/guest-game.service';
import { GuestSessionService } from './services/guest-session.service';
import { GuestSessionGuard } from './guards/guest-session.guard';

@Module({
  imports: [RedisModule, TrackModule, PoolModule],
  controllers: [GuestGameController],
  providers: [GuestGameService, GuestSessionService, GuestSessionGuard],
})
export class GuestModule {}
