export interface EmailMessage {
  to: string;
  subject: string;
  /** Both are sent. A client that refuses HTML still gets the link. */
  html: string;
  text: string;
}

/**
 * Somewhere to hand a message to. Two of these exist: one that talks to
 * Resend, and one that writes to the log for every environment that cannot.
 */
export interface EmailTransport {
  readonly name: string;
  send(message: EmailMessage, from: string): Promise<void>;
}
