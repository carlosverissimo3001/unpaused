import { Module } from '@nestjs/common';
import { GauntletController } from './controllers/gauntlet.controller';
import { GauntletService } from './services/gauntlet.service';
import { GauntletRunRepository } from './repositories/gauntlet-run.repository';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { TrackModule } from '../track/track.module';

@Module({
  imports: [AuthModule, PlaylistModule, TrackModule],
  controllers: [GauntletController],
  providers: [GauntletService, GauntletRunRepository],
})
export class GauntletModule {}
