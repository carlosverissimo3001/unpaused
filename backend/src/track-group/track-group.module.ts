import { Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { TrackGroupController } from './controllers/track-group.controller';
import { TrackGroupRepository } from './repositories/track-group.repository';
import { TrackGroupService } from './services/track-group.service';

@Module({
  imports: [PrismaModule],
  controllers: [TrackGroupController],
  providers: [TrackGroupRepository, TrackGroupService],
  exports: [TrackGroupService, TrackGroupRepository],
})
export class TrackGroupModule {}
