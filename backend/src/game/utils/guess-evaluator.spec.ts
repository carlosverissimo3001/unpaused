import { GameStatus, Track } from '@prisma/client';
import { GuessResult } from '../consts';
import { GuessDto } from '../dto/guess/guess.dto';
import {
  evaluateGuess,
  addGuessToHistory,
  calculateNextState,
  getSnippetDuration,
} from './guess-evaluator';

describe('guess-evaluator', () => {
  const makeTrack = (overrides?: Partial<Track>): Track =>
    ({
      id: 'track-actual',
      name: 'Shape of You',
      artistName: 'Ed Sheeran',
      albumName: '÷ (Divide)',
      albumImageUrl: null,
      albumUrl: null,
      releaseYear: 2017,
      previewUrl: 'https://example.com/preview.mp3',
      lastScrapedAt: new Date(),
      createdAt: new Date(),
      ...overrides,
    }) as Track;

  describe('evaluateGuess', () => {
    const track = makeTrack();

    it('should return Skip when skip is true', () => {
      expect(evaluateGuess({ skip: true } as GuessDto, track)).toBe(
        GuessResult.Skip,
      );
    });

    it('should return Skip when trackId is missing', () => {
      expect(evaluateGuess({} as GuessDto, track)).toBe(GuessResult.Skip);
    });

    it('should return Correct on exact trackId match', () => {
      expect(
        evaluateGuess({ trackId: 'track-actual' } as GuessDto, track),
      ).toBe(GuessResult.Correct);
    });

    it('should return Correct on forgiving name+artist match (different version)', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'different-id',
            trackName: 'Shape of You (Acoustic)',
            artistName: 'Ed Sheeran',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Correct);
    });

    it('should return ARTIST with case-insensitive artist match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'ed sheeran',
            albumName: 'Wrong Album',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Artist);
    });

    it('should return ALBUM with case-insensitive album match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Wrong Artist',
            albumName: '÷ (DIVIDE)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should return ARTIST_AND_ALBUM when both match', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong Song',
            artistName: 'ED SHEERAN',
            albumName: '÷ (divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.ArtistAndAlbum);
    });

    it('should return WRONG when nothing matches', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Wrong',
            albumName: 'Wrong',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Wrong);
    });

    it('should handle null guess artistName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            albumName: '÷ (Divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should handle null actual albumName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: 'Ed Sheeran',
            albumName: 'Some Album',
          } as GuessDto,
          makeTrack({ albumName: null }),
        ),
      ).toBe(GuessResult.Artist);
    });

    it('should handle empty string artistName', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: '',
            albumName: '÷ (Divide)',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Album);
    });

    it('should return WRONG when both artistName and albumName are empty', () => {
      expect(
        evaluateGuess(
          {
            trackId: 'wrong',
            trackName: 'Wrong',
            artistName: '',
            albumName: '',
          } as GuessDto,
          track,
        ),
      ).toBe(GuessResult.Wrong);
    });
  });

  describe('addGuessToHistory', () => {
    const track = makeTrack();

    it('should append a guess to empty history', () => {
      const result = addGuessToHistory([], GuessResult.Wrong, track, {
        trackId: 'wrong',
        trackName: 'Guess Song',
        artistName: 'Guess Artist',
      } as GuessDto);
      expect(result).toHaveLength(1);
      expect(result[0].trackName).toBe('Guess Song');
      expect(result[0].result).toBe(GuessResult.Wrong);
    });

    it('should use actual track name on correct guess', () => {
      const result = addGuessToHistory([], GuessResult.Correct, track, {
        trackId: track.id,
        trackName: 'Whatever',
      } as GuessDto);
      expect(result[0].trackName).toBe('Shape of You');
      expect(result[0].artistName).toBe('Ed Sheeran');
    });

    it('should not mutate existing history', () => {
      const existing = [
        {
          trackId: 'old',
          trackName: 'Old',
          artistName: 'Old',
          result: GuessResult.Wrong,
        },
      ];
      const result = addGuessToHistory(existing, GuessResult.Skip, track, {
        skip: true,
      } as GuessDto);
      expect(result).toHaveLength(2);
      expect(existing).toHaveLength(1);
    });
  });

  describe('calculateNextState', () => {
    it('should return WON when result is Correct', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Correct, 3);
      expect(status).toBe(GameStatus.WON);
      expect(gameOver).toBe(true);
    });

    it('should return LOST when max rounds reached', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Wrong, 6);
      expect(status).toBe(GameStatus.LOST);
      expect(gameOver).toBe(true);
    });

    it('should return PLAYING when still rounds remaining', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Wrong, 3);
      expect(status).toBe(GameStatus.PLAYING);
      expect(gameOver).toBe(false);
    });

    it('should return PLAYING on skip with rounds remaining', () => {
      const { status, gameOver } = calculateNextState(GuessResult.Skip, 1);
      expect(status).toBe(GameStatus.PLAYING);
      expect(gameOver).toBe(false);
    });
  });

  describe('getSnippetDuration', () => {
    it('should return first duration for round 0', () => {
      expect(getSnippetDuration(0)).toBe(0.5);
    });

    it('should return last duration for round >= MAX_ROUNDS', () => {
      expect(getSnippetDuration(10)).toBe(10);
    });
  });
});
