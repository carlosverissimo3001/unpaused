import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { VALIDATION_CONFIG } from './utils/validators/validators';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway terminates TLS at its own proxy, so without this every request
  // looks like it came from the proxy. Rate limiting that falls back to the
  // client IP would otherwise put every visitor in one bucket.
  app.set('trust proxy', 1);

  app.use(cookieParser());

  const portfolioOrigins = (process.env.PORTFOLIO_URL?.split(',') ?? [])
    .map((origin) => origin.trim())
    .filter(Boolean);

  /**
   * The portfolio gets its own CORS treatment, scoped to /demo and without
   * credentials. Adding it to the app-wide allow-list instead would let that
   * origin make cookie-bearing requests to every authenticated route, which
   * the demo neither needs nor should have: it is stateless and cookie-free.
   */
  if (portfolioOrigins.length) {
    app.use('/demo', (req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && portfolioOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
        res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
      }
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  app.enableCors({
    /**
     * A callback rather than the string, so this stays silent for origins it
     * does not own. Given a string, the cors package emits it as
     * Access-Control-Allow-Origin unconditionally, which overwrote the header
     * the /demo middleware had just set: preflight answered with the portfolio
     * origin, the actual request answered with the frontend's, and the browser
     * rejected the mismatch.
     */
    origin: (origin, callback) => callback(null, origin === frontendUrl),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(VALIDATION_CONFIG);
  await app.listen(process.env.PORT ?? 3001);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
