import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccountMergeService } from './services/account-merge.service';
import { SpotifyService } from './services/spotify.service';
import { SpotifyAuthService } from './services/spotify-auth.service';
import { SessionService } from './services/session.service';
import { UserRepository } from './repositories/user.repository';
import { ProvisioningSessionGuard } from '../utils/guards/provisioning-session.guard';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AccountMergeService,
    SpotifyService,
    SpotifyAuthService,
    SessionService,
    UserRepository,
    ProvisioningSessionGuard,
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
