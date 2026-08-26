import { Resend } from 'resend';
import { EmailMessage, EmailSender, EmailTransport } from '../types';

export class ResendEmailTransport implements EmailTransport {
  readonly name = 'resend';

  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage, sender: EmailSender): Promise<void> {
    // The SDK reports failures in the body rather than by throwing, so a
    // caller that only catches would treat a rejected send as delivered.
    const { error } = await this.client.emails.send({
      from: sender.from,
      ...(sender.replyTo && { replyTo: sender.replyTo }),
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
