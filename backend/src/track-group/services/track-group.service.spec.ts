import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrackGroupType } from '@prisma/client';
import { TrackGroupRepository } from '../repositories/track-group.repository';
import { TrackGroupService } from './track-group.service';

const mockRepository = {
  listWithCounts: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
};

const EIGHTIES = {
  id: 'group-1',
  type: TrackGroupType.DECADE,
  name: '1980s',
  slug: '1980s',
  imageUrl: 'https://example.test/eighties.jpg',
  createdAt: new Date(),
  trackCount: 490,
};

async function build() {
  const module = await Test.createTestingModule({
    providers: [
      TrackGroupService,
      { provide: TrackGroupRepository, useValue: mockRepository },
    ],
  }).compile();
  return module.get(TrackGroupService);
}

describe('TrackGroupService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns what the picker needs and nothing else', async () => {
    mockRepository.listWithCounts.mockResolvedValue([EIGHTIES]);
    const service = await build();

    const [group] = await service.list(TrackGroupType.DECADE);

    expect(group).toEqual({
      id: 'group-1',
      type: TrackGroupType.DECADE,
      name: '1980s',
      slug: '1980s',
      trackCount: 490,
      imageUrl: 'https://example.test/eighties.jpg',
    });
    // createdAt is ours, not the player's business.
    expect(group).not.toHaveProperty('createdAt');
  });

  it('leaves a missing cover absent rather than null', async () => {
    mockRepository.listWithCounts.mockResolvedValue([
      { ...EIGHTIES, imageUrl: null },
    ]);
    const service = await build();

    const [group] = await service.list(TrackGroupType.DECADE);

    expect(group.imageUrl).toBeUndefined();
  });

  it('refuses a group nobody has, rather than starting an empty round', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const service = await build();

    await expect(service.requireById('made-up')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
