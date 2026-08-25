import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { TrackModule } from '../track/track.module';
import { PoolModule } from '../pool/pool.module';
import { MultiplayerController } from './controllers/multiplayer.controller';
import { RoomService } from './services/room.service';
import { MultiplayerGameService } from './services/multiplayer-game.service';
import { TrackPoolService } from './services/track-pool.service';
import { RoomRepository } from './repositories/room.repository';
import { MultiplayerGameSessionRepository } from './repositories/multiplayer-game-session.repository';
import { RoomsGateway } from './gateways/rooms.gateway';
import { RoomPresenceService } from './services/room-presence.service';

@Module({
  imports: [AuthModule, PlaylistModule, TrackModule, PoolModule],
  controllers: [MultiplayerController],
  providers: [
    RoomService,
    MultiplayerGameService,
    TrackPoolService,
    RoomRepository,
    MultiplayerGameSessionRepository,
    RoomsGateway,
    RoomPresenceService,
  ],
  exports: [RoomService, MultiplayerGameService, RoomRepository],
})
export class MultiplayerModule {}
