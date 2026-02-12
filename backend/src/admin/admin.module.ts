import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StreakModule } from '../streak/streak.module';
import { AdminGuard } from '../utils/guards/admin-guard';
import { AdminController } from './controllers/admin.controller';

@Module({
  imports: [AuthModule, StreakModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
