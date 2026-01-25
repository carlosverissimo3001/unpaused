 
 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { VALIDATION_CONFIG } from './utils/validators/validators';
import { SESSION_COOKIE_NAME } from './auth/consts';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Unpaused Spotify API')
    .setDescription('The backend for the Spotify guessing game')
    .setVersion('1.0')
    .addCookieAuth('unpaused_session', {
      type: 'apiKey',
      in: 'cookie',
      name: SESSION_COOKIE_NAME
    })
    .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    });

  fs.writeFileSync(
    path.join(__dirname, '../..', 'swagger-spec.json'),
    JSON.stringify(document, null, 2),
  );

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(VALIDATION_CONFIG);
  await app.listen(process.env.PORT ?? 3001);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap();