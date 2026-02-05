import { GetHistoryDto } from '../get-history.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindGameSessionsDto extends GetHistoryDto {
  @ApiProperty({ description: 'The ID of the user' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Whether to only return completed games',
    type: Boolean,
  })
  onlyCompleted?: boolean;
}
