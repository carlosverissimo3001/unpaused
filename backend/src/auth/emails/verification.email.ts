import { EmailMessage } from '../../email/types';

/**
 * Deliberately plain. A transactional mail that looks like a newsletter is a
 * mail that gets filed like one, and the only thing anyone needs from this is
 * the link.
 */
export function verificationEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: 'Confirm your email for unpaused',
    text: [
      'Confirm your address to finish setting up your unpaused account:',
      '',
      link,
      '',
      'The link works once and expires in 24 hours.',
      'If you did not sign up, you can ignore this - nothing was created for you.',
    ].join('\n'),
    html: [
      '<p>Confirm your address to finish setting up your unpaused account:</p>',
      `<p><a href="${link}">Confirm my email</a></p>`,
      '<p>The link works once and expires in 24 hours.</p>',
      '<p>If you did not sign up, you can ignore this &mdash; nothing was created for you.</p>',
      `<p style="color:#888;font-size:12px">If the button does not work, paste this into your browser:<br>${link}</p>`,
    ].join('\n'),
  };
}
