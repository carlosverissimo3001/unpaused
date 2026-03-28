import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PatchUserDto {
  @ApiProperty({ description: 'Custom display name', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  displayName: string;
}
