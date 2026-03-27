import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const cloudinaryUrl =
      this.configService.getOrThrow<string>('CLOUDINARY_URL');
    const uri = new URL(cloudinaryUrl);
    cloudinary.config({
      cloud_name: uri.hostname,
      api_key: decodeURIComponent(uri.username),
      api_secret: decodeURIComponent(uri.password),
    });

    // Pre-warm the TCP/TLS connection to Cloudinary so the first upload
    // doesn't pay the full handshake cost.
    cloudinary.api.ping().catch(() => {
      // Non-fatal — if ping fails (e.g. bad credentials), uploads will
      // surface the real error themselves.
    });
  }

  async uploadAvatar(
    buffer: Buffer,
    userId: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'unpaused/avatars',
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [
            { width: 256, height: 256, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result!);
        },
      );

      // Write the entire buffer at once and signal end-of-stream
      uploadStream.end(buffer);
    });
  }

  async deleteAvatar(userId: string): Promise<void> {
    await cloudinary.uploader.destroy(`unpaused/avatars/user_${userId}`);
  }
}
