import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ConfirmEmailDto {
  @ApiProperty({ description: 'The token from the link in the email' })
  @IsString()
  @MinLength(1)
  token: string;
}
