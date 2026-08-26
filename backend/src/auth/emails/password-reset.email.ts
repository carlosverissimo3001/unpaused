import { EmailMessage } from '../../email/types';
import { renderEmail } from './layout';

export function passwordResetEmail(to: string, link: string): EmailMessage {
  return {
    to,
    subject: 'Reset your unpaused password',
    text: [
      'Someone asked to reset the password for your unpaused account.',
      '',
      link,
      '',
      'The link works once and expires in an hour.',
      'If that was not you, nothing has changed and you can ignore this.',
    ].join('\n'),
    html: renderEmail({
      heading: 'Choose a new password',
      paragraphs: [
        'Someone asked to reset the password for your unpaused account. Your stats, streak and history are all still there.',
      ],
      action: { label: 'Choose a new password', href: link },
      footnote:
        'The link works once and expires in an hour. If that was not you, nothing has changed and you can ignore this.',
    }),
  };
}
