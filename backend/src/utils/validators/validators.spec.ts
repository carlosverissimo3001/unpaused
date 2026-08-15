import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { VALIDATION_CONFIG } from './validators';
import { SpotifyOAuthCallbackDto } from '../../auth/dto/spotify/spotify-oauth-callback.dto';

const meta: ArgumentMetadata = {
  type: 'query',
  metatype: SpotifyOAuthCallbackDto,
};

describe('Spotify OAuth callback validation', () => {
  it('accepts the ubi param Spotify sends after a consent screen', async () => {
    const query = { code: 'abc', state: 'xyz', ubi: 'CAIQ3dvUvoA0' };

    await expect(VALIDATION_CONFIG.transform(query, meta)).resolves.toEqual(
      query,
    );
  });

  it('rejects a payload missing the code', async () => {
    await expect(
      VALIDATION_CONFIG.transform({ state: 'xyz' }, meta),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
