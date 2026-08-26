/**
 * Throwaway smoke test for the mail transport. Not meant to be committed.
 *   pnpm exec ts-node -r tsconfig-paths/register scripts/send-test-email.ts you@example.com
 */
import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../src/logger/logger.service';
import { EmailService } from '../src/email/services/email.service';

async function main() {
  const to = process.argv[2];
  if (!to) {
    throw new Error('Pass a recipient address as the first argument');
  }

  const config = new ConfigService();
  const email = new EmailService(config, new AppLoggerService());

  console.log(`transport can send: ${email.canSend}`);
  console.log(`from: ${config.get('EMAIL_FROM')}`);

  const sent = await email.send({
    to,
    subject: 'unpaused: mail transport works',
    html: '<p>If you are reading this, the domain is verified and the transport is wired up.</p>',
    text: 'If you are reading this, the domain is verified and the transport is wired up.',
  });

  console.log(`send returned: ${sent}`);
}

void main();
