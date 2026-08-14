import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DemoPlaylistEntity {
  @ApiProperty({ description: 'Stable key used when starting a round' })
  slug: string;

  @ApiProperty({ description: 'Chart name as Spotify publishes it' })
  name: string;

  @ApiProperty({ description: 'Chart cover art' })
  imageUrl: string;

  @ApiPropertyOptional({ type: String })
  description: string | null;
}
