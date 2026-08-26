import { Resend } from 'resend';
import { EmailMessage, EmailTransport } from '../types';

/**
 * Resend was chosen over SendGrid, which no longer has a free plan, and over
 * SES, whose sandbox only sends to addresses already verified — the one thing
 * a signup confirmation cannot do.
 */
export class ResendEmailTransport implements EmailTransport {
  readonly name = 'resend';

  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage, from: string): Promise<void> {
    // The SDK reports failures in the body rather than by throwing, so a
    // caller that only catches would treat a rejected send as delivered.
    const { error } = await this.client.emails.send({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(`${error.name}: ${error.message}`);
    }
  }
}
