import { Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';

/**
 * Search is its own module because both authenticated and guest play use it —
 * it stopped being game-specific once it moved off per-user Spotify tokens.
 */
@Module({
  // SearchController still guards the authenticated route with SessionGuard.
  imports: [AuthModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
