import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { EXTERNAL_QUERY_VALIDATION, VALIDATION_CONFIG } from './validators';
import { SpotifyOAuthCallbackDto } from '../../auth/dto/spotify/spotify-oauth-callback.dto';

const meta: ArgumentMetadata = {
  type: 'query',
  metatype: SpotifyOAuthCallbackDto,
};

// Spotify appends `ubi` when the user clicks through the consent screen, so a
// first-time authorisation carries a param the DTO does not declare.
const callback = { code: 'abc', state: 'xyz', ubi: 'CAIQ3dvUvoA0' };

describe('EXTERNAL_QUERY_VALIDATION', () => {
  it('strips undeclared params instead of rejecting them', async () => {
    const result = await EXTERNAL_QUERY_VALIDATION.transform(callback, meta);

    expect(result).toEqual({ code: 'abc', state: 'xyz' });
  });

  it('still rejects a payload missing a required field', async () => {
    await expect(
      EXTERNAL_QUERY_VALIDATION.transform({ state: 'xyz' }, meta),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('VALIDATION_CONFIG', () => {
  it('rejects undeclared params, which is why the callback needs its own pipe', async () => {
    await expect(
      VALIDATION_CONFIG.transform(callback, meta),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
