import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AvatarSource } from '@prisma/client';

export class UpdateAvatarSourceDto {
  @ApiProperty({ enum: AvatarSource, description: 'Which avatar to use' })
  @IsEnum(AvatarSource)
  source: AvatarSource;
}
