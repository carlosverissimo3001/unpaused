import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AvatarSource } from '@prisma/client';

export class UploadAvatarResponseDto {
  @ApiPropertyOptional({
    description: 'The Cloudinary URL of the uploaded avatar',
    type: String,
  })
  customAvatarUrl?: string;

  @ApiProperty({ enum: AvatarSource })
  avatarSource: AvatarSource;

  @ApiPropertyOptional({
    description: 'Effective avatar URL for display',
    type: String,
  })
  avatarUrl?: string;
}
