import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetaGameExtrasVo {
  @ApiProperty({
    description: 'Show this emoji on the win screen',
  })
  winEmoji: string;

  constructor(winEmoji: string) {
    this.winEmoji = winEmoji;
  }
}

export class GameExtrasVo {
  @ApiPropertyOptional({
    description:
      'Optional personalized rank title (easter egg for special users)',
    type: String,
  })
  rankTitle?: string;

  @ApiPropertyOptional({
    description: 'Optional personalized note (easter egg for special users)',
    type: String,
  })
  specialNote?: string;

  @ApiPropertyOptional({
    description:
      'Optional meta flags (e.g. showHeart for special win celebration)',
    type: Object,
  })
  meta?: MetaGameExtrasVo;

  constructor(
    rankTitle?: string,
    specialNote?: string,
    meta?: MetaGameExtrasVo,
  ) {
    this.rankTitle = rankTitle;
    this.specialNote = specialNote;
    this.meta = meta;
  }
}
