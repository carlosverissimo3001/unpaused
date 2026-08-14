import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoPlaylistService } from './demo-playlist.service';
import { DemoTrackRepository } from '../repositories/demo-track.repository';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { DEMO_PLAYLISTS, DEMO_SNIPPET_STEPS } from '../demo.constants';
import { DemoTrackEntity } from '../entities/demo-track.entity';
import { DemoRoundStatus } from '../dto/demo-round.dto';

const track = (n: number): DemoTrackEntity => ({
  id: `track-${n}`,
  playlistSlug: 'pt',
  name: `Track ${n}`,
  artistName: `Artist ${n}`,
  albumImageUrl: `https://img/${n}`,
  previewUrl: `https://preview/${n}.mp3`,
  position: n,
  fetchedAt: new Date(),
});

describe('DemoService', () => {
  let service: DemoService;
  let repository: jest.Mocked<DemoTrackRepository>;
  let playlists: jest.Mocked<DemoPlaylistService>;
  let store: Map<string, string>;

  beforeEach(async () => {
    store = new Map();

    const redis = {
      get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
      set: jest.fn((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve();
      }),
    };

    const logger = {
      child: () => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: RedisService, useValue: redis },
        {
          provide: DemoTrackRepository,
          useValue: {
            findByPlaylist: jest.fn(),
            countByPlaylist: jest.fn(),
            replacePlaylist: jest.fn(),
          },
        },
        { provide: DemoPlaylistService, useValue: { fetchTracks: jest.fn() } },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(DemoService);
    repository = module.get(DemoTrackRepository);
    playlists = module.get(DemoPlaylistService);
  });

  describe('createRound', () => {
    it('rejects an unknown playlist', async () => {
      await expect(service.createRound('nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reports unavailable when the pool is not populated', async () => {
      repository.findByPlaylist.mockResolvedValue([track(1), track(2)]);
      await expect(service.createRound('pt')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('returns four options and never leaks the answer', async () => {
      repository.findByPlaylist.mockResolvedValue([1, 2, 3, 4, 5].map(track));

      const round = await service.createRound('pt');

      expect(round.options).toHaveLength(4);
      expect(new Set(round.options.map((o) => o.id)).size).toBe(4);
      expect(round.attempt).toBe(1);
      expect(round.snippetDuration).toBe(DEMO_SNIPPET_STEPS[0]);
      // The payload carries the answer's audio, which it must, but nothing
      // that says which of the four options it belongs to.
      expect(round.previewUrl).toMatch(/https:\/\/preview\//);
      expect(round).not.toHaveProperty('answer');
      expect(round.options.every((o) => !('previewUrl' in o))).toBe(true);
    });
  });

  describe('guess', () => {
    const startRound = async () => {
      repository.findByPlaylist.mockResolvedValue([1, 2, 3, 4, 5].map(track));
      const round = await service.createRound('pt');
      const state = JSON.parse(
        store.get(`demo:round:${round.roundId}`) as string,
      ) as { answer: DemoTrackEntity };
      return { round, answerId: state.answer.id };
    };

    it('rejects a track that is not one of the options', async () => {
      const { round } = await startRound();
      await expect(service.guess(round.roundId, 'track-999')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown round', async () => {
      await expect(service.guess('missing', 'track-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('wins and reveals the answer', async () => {
      const { round, answerId } = await startRound();

      const result = await service.guess(round.roundId, answerId);

      expect(result.correct).toBe(true);
      expect(result.status).toBe(DemoRoundStatus.WON);
      expect(result.answer?.id).toBe(answerId);
    });

    it('withholds the answer while the round is still playing', async () => {
      const { round, answerId } = await startRound();
      const wrong = round.options.find((o) => o.id !== answerId)!;

      const result = await service.guess(round.roundId, wrong.id);

      expect(result.correct).toBe(false);
      expect(result.status).toBe(DemoRoundStatus.PLAYING);
      expect(result.answer).toBeUndefined();
      expect(result.wrongIds).toEqual([wrong.id]);
      expect(result.snippetDuration).toBe(DEMO_SNIPPET_STEPS[1]);
    });

    it('loses after exhausting every attempt, then reveals', async () => {
      const { round, answerId } = await startRound();
      const wrong = round.options.filter((o) => o.id !== answerId);

      let result;
      for (let i = 0; i < DEMO_SNIPPET_STEPS.length; i++) {
        result = await service.guess(round.roundId, wrong[i % wrong.length].id);
      }

      expect(result?.status).toBe(DemoRoundStatus.LOST);
      expect(result?.correct).toBe(false);
      expect(result?.answer?.id).toBe(answerId);
    });

    it('is idempotent once resolved', async () => {
      const { round, answerId } = await startRound();
      await service.guess(round.roundId, answerId);

      const again = await service.guess(round.roundId, answerId);

      expect(again.status).toBe(DemoRoundStatus.WON);
    });
  });

  describe('refreshAll', () => {
    it('leaves the previous set alone for a playlist that fails', async () => {
      const [failing, ...rest] = DEMO_PLAYLISTS;
      playlists.fetchTracks.mockImplementation((playlistId: string) =>
        playlistId === failing.playlistId
          ? Promise.reject(new Error('spotify changed'))
          : Promise.resolve([1, 2, 3, 4, 5].map(track)),
      );
      repository.replacePlaylist.mockResolvedValue(5);

      const result = await service.refreshAll();

      // The one that failed must not be touched, or a bad fetch would wipe
      // yesterday's working tracks.
      expect(repository.replacePlaylist).not.toHaveBeenCalledWith(
        failing.slug,
        expect.anything(),
      );
      expect(result[failing.slug]).toBe(0);

      // Every other playlist still refreshed.
      for (const playlist of rest) {
        expect(repository.replacePlaylist).toHaveBeenCalledWith(
          playlist.slug,
          expect.any(Array),
        );
        expect(result[playlist.slug]).toBe(5);
      }
    });

    it('throws when every playlist fails, so the queue retries', async () => {
      playlists.fetchTracks.mockRejectedValue(new Error('spotify changed'));

      await expect(service.refreshAll()).rejects.toThrow(
        'Demo refresh failed for every playlist',
      );
      expect(repository.replacePlaylist).not.toHaveBeenCalled();
    });
  });
});
