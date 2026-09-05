import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GauntletDifficulty, GauntletSource } from '@prisma/client';
import { StartRunDto } from './start-run.dto';

async function errorsFor(body: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(StartRunDto, {
    difficulty: GauntletDifficulty.MEDIUM,
    ...body,
  });
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('StartRunDto', () => {
  it('accepts a playlist run that names its playlist', async () => {
    await expect(
      errorsFor({
        source: GauntletSource.PLAYLIST,
        playlistId: 'playlist-a',
      }),
    ).resolves.toEqual([]);
  });

  it('accepts a curated run narrowed to a group', async () => {
    await expect(
      errorsFor({
        source: GauntletSource.CURATED,
        trackGroupId: 'group-90s',
      }),
    ).resolves.toEqual([]);
  });

  it('accepts a curated run drawing from the whole pool', async () => {
    await expect(
      errorsFor({ source: GauntletSource.CURATED }),
    ).resolves.toEqual([]);
  });

  it('refuses a playlist run with no playlist', async () => {
    await expect(
      errorsFor({ source: GauntletSource.PLAYLIST }),
    ).resolves.toEqual(['playlistId']);
  });

  // The reason the source is carried rather than inferred: with two optional
  // ids and no discriminator, one of these would silently win.
  it('refuses a curated run that also carries a playlist', async () => {
    await expect(
      errorsFor({
        source: GauntletSource.CURATED,
        playlistId: 'playlist-a',
      }),
    ).resolves.toEqual(['playlistId']);
  });

  it('refuses a playlist run that also carries a group', async () => {
    await expect(
      errorsFor({
        source: GauntletSource.PLAYLIST,
        playlistId: 'playlist-a',
        trackGroupId: 'group-90s',
      }),
    ).resolves.toEqual(['trackGroupId']);
  });

  it('refuses a source it has never heard of', async () => {
    await expect(errorsFor({ source: 'EVERYTHING' })).resolves.toContain(
      'source',
    );
  });
});
