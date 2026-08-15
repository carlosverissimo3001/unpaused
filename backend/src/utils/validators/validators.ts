import { ValidationPipe } from '@nestjs/common';

export const VALIDATION_CONFIG = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  forbidNonWhitelisted: true,
});

/** For third-party redirects, which append their own params (Spotify's `ubi`). */
export const EXTERNAL_QUERY_VALIDATION = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
});
