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

  describe('who a special group is for', () => {
    const spotifyTrusted = {
      spotifyUserId: 'spotify-1',
      isTrusted: true,
    } as never;
    const spotifyUntrusted = {
      spotifyUserId: 'spotify-1',
      isTrusted: false,
    } as never;
    const trustedNoSpotify = {
      spotifyUserId: null,
      isTrusted: true,
    } as never;

    it('shows an ordinary group to anyone, signed in or not', () => {
      expect(TrackGroupService.isVisible(TrackGroupType.DECADE, null)).toBe(
        true,
      );
    });

    it('shows a special group to a trusted Spotify account', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, spotifyTrusted),
      ).toBe(true);
    });

    it('hides it from an untrusted Spotify account', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, spotifyUntrusted),
      ).toBe(false);
    });

    it('hides it from a trusted account with no Spotify', () => {
      expect(
        TrackGroupService.isVisible(TrackGroupType.SPECIAL, trustedNoSpotify),
      ).toBe(false);
    });

    it('hides it from a visitor with no session at all', () => {
      expect(TrackGroupService.isVisible(TrackGroupType.SPECIAL, null)).toBe(
        false,
      );
    });
  });
});
