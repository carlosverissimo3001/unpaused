import { ApiProperty } from '@nestjs/swagger';

export class PlayedTodayDto {
  @ApiProperty({ description: "Whether the user has played today's daily" })
  playedToday: boolean;
}
