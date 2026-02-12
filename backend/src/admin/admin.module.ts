import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MessageModule } from '../message/message.module';
import { StreakModule } from '../streak/streak.module';
import { AdminGuard } from '../utils/guards/admin-guard';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [AuthModule, MessageModule, StreakModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
