import { Global, Module } from '@nestjs/common';
import { EmailService } from './services/email.service';

/**
 * Global like the logger and Redis: mail is a thing any feature might need to
 * send, and threading an import through every module that grows a notification
 * is churn for nothing.
 */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
