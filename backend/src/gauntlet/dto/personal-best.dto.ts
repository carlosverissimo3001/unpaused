import { ApiProperty } from '@nestjs/swagger';

export class PersonalBestDto {
  @ApiProperty({ description: "The user's personal best gauntlet score" })
  personalBest: number;
}
