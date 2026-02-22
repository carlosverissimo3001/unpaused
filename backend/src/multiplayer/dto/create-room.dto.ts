import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Number of rounds for the game',
    enum: [3, 5, 10],
  })
  @IsInt()
  @IsIn([3, 5, 10])
  roundCount: number;
}
