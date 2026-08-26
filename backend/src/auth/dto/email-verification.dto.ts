import { ApiProperty } from '@nestjs/swagger';

export class EmailVerificationResultDto {
  @ApiProperty({
    example: false,
    description:
      'Whether the link was live. False covers wrong, expired and already used alike: all three mean the same thing to whoever is holding it.',
  })
  verified: boolean;
}
