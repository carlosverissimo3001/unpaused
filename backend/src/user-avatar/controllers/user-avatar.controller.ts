import {
  Body,
  Controller,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiCookieAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { SessionId } from '../../utils/decorators/sessionId.decorator';
import { SessionGuard } from '../../utils/guards/session-guard';
import { UpdateAvatarSourceDto } from '../dto/update-avatar-source.dto';
import { UploadAvatarResponseDto } from '../dto/upload-avatar-response.dto';
import { UserAvatarService } from '../services/user-avatar.service';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../consts';
import { Throttle } from '@nestjs/throttler';
import { SessionThrottlerGuard } from '@throttle/guards/session-throttler.guard';
import {
  THROTTLE_AVATAR,
  THROTTLE_AVATAR_LIMIT,
  THROTTLE_TTL,
} from '@throttle/throttle.constants';

@ApiTags('Api')
@Controller('user-avatar')
@UseGuards(SessionGuard)
export class UserAvatarController {
  constructor(private readonly userAvatarService: UserAvatarService) {}

  @Post('upload')
  @UseGuards(SessionThrottlerGuard)
  @Throttle({
    [THROTTLE_AVATAR]: { limit: THROTTLE_AVATAR_LIMIT, ttl: THROTTLE_TTL },
  })
  @ApiOperation({ summary: 'Upload a custom avatar image' })
  @ApiCookieAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: UploadAvatarResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
      },
    }),
  )
  async upload(
    @SessionId() sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    return this.userAvatarService.uploadAvatar(sessionId, file);
  }

  @Patch('source')
  @ApiOperation({ summary: 'Switch between Spotify and custom avatar' })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, type: UploadAvatarResponseDto })
  async updateSource(
    @SessionId() sessionId: string,
    @Body() dto: UpdateAvatarSourceDto,
  ): Promise<UploadAvatarResponseDto> {
    return this.userAvatarService.updateSource(sessionId, dto.source);
  }
}
