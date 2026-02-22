import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MultiplayerController } from './controllers/multiplayer.controller';
import { RoomService } from './services/room.service';
import { MultiplayerGameService } from './services/multiplayer-game.service';
import { RoomRepository } from './repositories/room.repository';
import { MultiplayerGameSessionRepository } from './repositories/multiplayer-game-session.repository';

@Module({
  imports: [AuthModule],
  controllers: [MultiplayerController],
  providers: [
    RoomService,
    MultiplayerGameService,
    RoomRepository,
    MultiplayerGameSessionRepository,
  ],
  exports: [RoomService, MultiplayerGameService, RoomRepository],
})
export class MultiplayerModule {}
