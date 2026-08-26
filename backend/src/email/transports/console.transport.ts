import { AppLoggerService } from '../../logger/logger.service';
import { EmailMessage, EmailTransport } from '../types';

/**
 * Writes the mail to the log instead of sending it. Used wherever there is no
 * API key configured, so the flow can be followed end to end without one.
 *
 * Prints the text body rather than the HTML, because the thing anyone reading
 * a log actually wants is the link.
 */
export class ConsoleEmailTransport implements EmailTransport {
  readonly name = 'console';

  constructor(private readonly logger: AppLoggerService) {}

  send(message: EmailMessage, from: string): Promise<void> {
    this.logger.log(
      `Email not sent (no provider configured)\n` +
        `  from:    ${from}\n` +
        `  to:      ${message.to}\n` +
        `  subject: ${message.subject}\n` +
        `${message.text}`,
    );
    return Promise.resolve();
  }
}
