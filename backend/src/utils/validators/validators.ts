import { ValidationPipe } from '@nestjs/common';

export const VALIDATION_CONFIG = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  forbidNonWhitelisted: true,
});
