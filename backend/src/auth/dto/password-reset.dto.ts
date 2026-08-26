import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH, normalizeEmail } from '../utils/password';

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'The address to send a reset link to' })
  @Transform(({ value }) => normalizeEmail(String(value)))
  @IsEmail()
  email: string;
}

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'The token from the link in the email' })
  @IsString()
  @MinLength(1)
  token: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'The password being replaced' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  newPassword: string;
}

export class PasswordResetResultDto {
  @ApiProperty({
    example: false,
    description:
      'Whether the link was live. False covers wrong, expired and already used alike.',
  })
  reset: boolean;
}
