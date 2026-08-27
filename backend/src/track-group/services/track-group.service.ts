import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackGroup, TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupDto } from '../dto/track-group.dto';

@Injectable()
export class TrackGroupService {
  constructor(private readonly repository: TrackGroupRepository) {}

  async list(type: TrackGroupType): Promise<TrackGroupDto[]> {
    const groups = await this.repository.listWithCounts(type);
    return groups.map(
      ({ id, type: groupType, name, slug, imageUrl, trackCount }) => ({
        id,
        type: groupType,
        name,
        slug,
        trackCount,
        imageUrl: imageUrl ?? undefined,
      }),
    );
  }

  /** Throws rather than returning null: a round cannot start without one. */
  async requireById(id: string): Promise<TrackGroup> {
    const group = await this.repository.findById(id);
    if (!group) {
      throw new NotFoundException(`No track group ${id}`);
    }
    return group;
  }
}
