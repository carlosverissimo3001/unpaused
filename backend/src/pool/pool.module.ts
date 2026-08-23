import { Module } from '@nestjs/common';
import { TrackModule } from '../track/track.module';
import { PoolTrackRepository } from './repositories/pool-track.repository';
import { PoolService } from './services/pool.service';

@Module({
  imports: [TrackModule],
  providers: [PoolService, PoolTrackRepository],
  exports: [PoolService],
})
export class PoolModule {}
