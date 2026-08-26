/**
 * Without a key the console transport prints the mail instead of sending it,
 * so these flows can be worked on without an inbox or a key at all.
 *
 * The free plan verifies one domain, so every key on the account sends from
 * the same address and draws on the same daily allowance -- a local key is
 * sending real mail, not a sandbox.
 */
export const RESEND_API_KEY = 'RESEND_API_KEY';
export const EMAIL_FROM = 'EMAIL_FROM';
export const EMAIL_REPLY_TO = 'EMAIL_REPLY_TO';

/** Resend's free plan allows 3,000 a month and no more than 100 in a day. */
export const EMAIL_DAILY_ALLOWANCE = 100;
