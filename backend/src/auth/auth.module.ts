import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccountMergeService } from './services/account-merge.service';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { SessionService } from './services/session.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountMergeService,
    SpotifyService,
    SpotifyAuthService,
    SessionService,
    UserRepository,
  ],
  exports: [
    AuthService,
    AccountMergeService,
    SessionService,
    SpotifyAuthService,
    UserRepository,
  ],
})
export class AuthModule {}
