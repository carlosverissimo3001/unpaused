import { BadRequestException, Injectable } from '@nestjs/common';
import { AvatarSource } from '@prisma/client';
import { AuthService } from '../../auth/services/auth.service';
import { CloudinaryService } from './cloudinary.service';
import { UserAvatarRepository } from '../repositories/user-avatar.repository';
import { UploadAvatarResponseDto } from '../dto/upload-avatar-response.dto';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../consts';

@Injectable()
export class UserAvatarService {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userAvatarRepository: UserAvatarRepository,
  ) {}

  async uploadAvatar(
    sessionId: string,
    file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required.');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('File too large. Maximum size is 5 MB.');
    }

    const user = await this.authService.getUserBySessionId(sessionId);

    const result = await this.cloudinaryService.uploadAvatar(
      file.buffer,
      user.id,
    );

    const updated = await this.userAvatarRepository.setCustomAvatar(
      user.id,
      result.secure_url,
    );

    return {
      customAvatarUrl: updated.customAvatarUrl ?? undefined,
      avatarSource: updated.avatarSource,
      avatarUrl: updated.customAvatarUrl ?? undefined,
    };
  }

  async updateSource(
    sessionId: string,
    source: AvatarSource,
  ): Promise<UploadAvatarResponseDto> {
    const user = await this.authService.getUserBySessionId(sessionId);

    if (source === AvatarSource.CUSTOM && !user.customAvatarUrl) {
      throw new BadRequestException(
        'No custom avatar uploaded yet. Please upload an image first.',
      );
    }

    const updated = await this.userAvatarRepository.setAvatarSource(
      user.id,
      source,
    );

    const effectiveUrl =
      updated.avatarSource === AvatarSource.CUSTOM
        ? (updated.customAvatarUrl ?? undefined)
        : (updated.avatarUrl ?? undefined);

    return {
      customAvatarUrl: updated.customAvatarUrl ?? undefined,
      avatarSource: updated.avatarSource,
      avatarUrl: effectiveUrl,
    };
  }
}
