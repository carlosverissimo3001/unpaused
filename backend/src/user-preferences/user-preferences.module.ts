import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserPreferencesController } from './controllers/user-preferences.controller';
import { UserPreferencesService } from './services/user-preferences.service';
import { UserPreferencesRepository } from './repositories/user-preferences.repository';

@Module({
  imports: [AuthModule],
  controllers: [UserPreferencesController],
  providers: [UserPreferencesService, UserPreferencesRepository],
})
export class UserPreferencesModule {}
