import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { normalizeEmail } from '../utils/password';

export class LoginDto {
  @ApiProperty({ description: 'Email address of the account' })
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail()
  email: string;

  // No MinLength: an old password that predates the rule must still log in.
  @ApiProperty()
  @IsString()
  password: string;
}
