import { ApiProperty } from '@nestjs/swagger';

export class UserPreferenceDto {
  @ApiProperty({ description: 'Show progressively blurred album art hint' })
  showAlbumHint: boolean;

  @ApiProperty({ description: 'Show genre, decade, and other text hints' })
  showTextHints: boolean;

  /* @ApiProperty({ description: 'Auto-play snippet when a round starts' })
  autoPlay: boolean; */

  @ApiProperty({ description: 'Reduce motion and animations' })
  reducedMotion: boolean;

  @ApiProperty({ description: 'Show guess history during gameplay' })
  showGuessHistory: boolean;
}
