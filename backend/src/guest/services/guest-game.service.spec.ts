import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameStatus } from '@prisma/client';
import { GuestGameService } from './guest-game.service';
import { PoolService } from '../../pool/services/pool.service';
import { TrackService } from '../../track/services/track.service';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { GuessResult } from '../../game/consts';

const trackEntity = (n: number, previewUrl?: string): TrackEntity =>
  new TrackEntity({
    id: `track-${n}`,
    name: `Track ${n}`,
    artistName: `Artist ${n}`,
    allArtists: [`Artist ${n}`],
    previewUrl,
    lastScrapedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

describe('GuestGameService', () => {
  let service: GuestGameService;
  let trackService: jest.Mocked<TrackService>;
  let poolService: jest.Mocked<PoolService>;
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
        GuestGameService,
        { provide: RedisService, useValue: redis },
        {
          provide: TrackService,
          useValue: { findById: jest.fn(), resolvePreview: jest.fn() },
        },
        {
          provide: PoolService,
          useValue: { pickTrack: jest.fn() },
        },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(GuestGameService);
    trackService = module.get(TrackService);
    poolService = module.get(PoolService);
  });

  describe('startGame', () => {
    it('plays the first drawn track that has resolvable audio', async () => {
      poolService.pickTrack.mockResolvedValue(trackEntity(1, undefined));
      trackService.resolvePreview.mockResolvedValue(
        'https://preview/track-1.mp3',
      );

      const state = await service.startGame('guest-1');

      expect(state.sessionId).toBeTruthy();
      expect(state.currentRound).toBe(0);
      expect(state.previewUrl).toMatch(/^https:\/\/preview\//);
    });

    it('gives up once every draw fails to resolve audio', async () => {
      poolService.pickTrack.mockResolvedValue(trackEntity(1, undefined));
      trackService.resolvePreview.mockResolvedValue(null);

      await expect(service.startGame('guest-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('submitGuess / getGameState', () => {
    async function startWithTrack(previewUrl = 'https://preview/track-1.mp3') {
      poolService.pickTrack.mockResolvedValue(trackEntity(1, previewUrl));
      trackService.resolvePreview.mockResolvedValue(previewUrl);
      trackService.findById.mockResolvedValue(trackEntity(1, previewUrl));
      const state = await service.startGame('guest-1');
      return state.sessionId;
    }

    it('scores a correct guess as a win using the shared evaluator', async () => {
      const roundId = await startWithTrack();

      const result = await service.submitGuess('guest-1', roundId, {
        trackId: 'track-1',
      });

      expect(result.result).toBe(GuessResult.Correct);
      expect(result.gameOver).toBe(true);
      expect(result.status).toBe(GameStatus.WON);
    });

    it('rejects a guess from a different guest than the one who started the round', async () => {
      const roundId = await startWithTrack();

      await expect(
        service.submitGuess('someone-else', roundId, { trackId: 'track-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects guesses once the round is already over', async () => {
      const roundId = await startWithTrack();
      await service.submitGuess('guest-1', roundId, { trackId: 'track-1' });

      await expect(
        service.submitGuess('guest-1', roundId, { skip: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('only exposes the answer through getGameState after the round ends', async () => {
      const roundId = await startWithTrack();

      const beforeReveal = await service.getGameState('guest-1', roundId);
      expect(beforeReveal.answer).toBeUndefined();

      await service.submitGuess('guest-1', roundId, { trackId: 'track-1' });

      const afterReveal = await service.getGameState('guest-1', roundId);
      expect(afterReveal.answer?.id).toBe('track-1');
    });
  });
});
