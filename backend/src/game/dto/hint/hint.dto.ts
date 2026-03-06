import { ApiProperty } from '@nestjs/swagger';
import { HintType } from '../../types';

export class HintDto {
  @ApiProperty({ description: 'The round this hint was revealed' })
  round: number;

  @ApiProperty({
    description: 'Hint type identifier (genre, decade, etc.)',
    enum: HintType,
  })
  type: HintType;

  @ApiProperty({ description: 'Human-readable label for the hint' })
  label: string;

  @ApiProperty({ description: 'The hint value' })
  value: string;
}
