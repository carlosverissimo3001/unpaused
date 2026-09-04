import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../utils/password';
import { IsDeliverableEmail } from '../../utils/decorators/isDeliverableEmail.decorator';

export class SignupDto {
  @ApiProperty({ description: 'Email address to sign up with' })
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail()
  @IsDeliverableEmail()
  email: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password: string;
}
