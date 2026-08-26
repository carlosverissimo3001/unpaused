export interface EmailMessage {
  to: string;
  subject: string;
  /** Both are sent. A client that refuses HTML still gets the link. */
  html: string;
  text: string;
}

export interface EmailTransport {
  readonly name: string;
  send(message: EmailMessage, from: string): Promise<void>;
}
