import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { SessionService } from './services/session.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SpotifyService,
    SpotifyAuthService,
    SessionService,
    UserRepository,
  ],
  exports: [AuthService, SessionService, SpotifyAuthService],
})
export class AuthModule {}
