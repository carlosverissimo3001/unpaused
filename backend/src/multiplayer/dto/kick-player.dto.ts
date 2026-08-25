import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class KickPlayerDto {
  @ApiProperty({ description: 'The player to remove from the room' })
  @IsUUID()
  userId: string;
}
