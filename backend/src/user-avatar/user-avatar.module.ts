import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserAvatarController } from './controllers/user-avatar.controller';
import { UserAvatarService } from './services/user-avatar.service';
import { CloudinaryService } from './services/cloudinary.service';
import { UserAvatarRepository } from './repositories/user-avatar.repository';

@Module({
  imports: [AuthModule],
  controllers: [UserAvatarController],
  providers: [UserAvatarService, CloudinaryService, UserAvatarRepository],
})
export class UserAvatarModule {}
