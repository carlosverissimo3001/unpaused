import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../../logger/logger.service';
import { EMAIL_FROM, RESEND_API_KEY } from '../consts';
import { ConsoleEmailTransport } from '../transports/console.transport';
import { ResendEmailTransport } from '../transports/resend.transport';
import { EmailMessage, EmailTransport } from '../types';

const DEFAULT_FROM = 'unpaused <onboarding@resend.dev>';

@Injectable()
export class EmailService {
  private readonly logger: AppLoggerService;
  private readonly transport: EmailTransport;
  private readonly from: string;

  constructor(
    private readonly configService: ConfigService,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.child(EmailService.name);
    this.from = this.configService.get<string>(EMAIL_FROM) || DEFAULT_FROM;

    const apiKey = this.configService.get<string>(RESEND_API_KEY);
    this.transport = apiKey
      ? new ResendEmailTransport(apiKey)
      : new ConsoleEmailTransport(this.logger);

    this.logger.log(`Sending mail via the ${this.transport.name} transport`);
  }

  /** Whether mail actually leaves the building, rather than reaching a log. */
  get canSend(): boolean {
    return this.transport.name !== 'console';
  }

  /**
   * Returns whether it worked rather than throwing. Every caller so far is a
   * flow that must answer identically whether or not an address exists, so a
   * failure here cannot be allowed to change what the response looks like.
   */
  async send(message: EmailMessage): Promise<boolean> {
    try {
      await this.transport.send(message, this.from);
      return true;
    } catch (err) {
      // The address is deliberately absent: a log that lists who was mailed is
      // a list of this site's users.
      this.logger.error(`Could not send "${message.subject}"`, err);
      return false;
    }
  }
}
