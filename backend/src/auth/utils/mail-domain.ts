import { promises as dns } from 'dns';

export interface DnsResolver {
  resolveMx(domain: string): Promise<unknown[]>;
  resolve4(domain: string): Promise<unknown[]>;
}

const NODE_RESOLVER: DnsResolver = {
  resolveMx: (domain) => dns.resolveMx(domain),
  resolve4: (domain) => dns.resolve4(domain),
};

/** A name that resolved to nothing. Anything else is the resolver's problem. */
const NO_RECORD = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN']);

const LOOKUP_TIMEOUT_MS = 2_000;
const CACHE_TTL_MS = 10 * 60 * 1000;

const cache = new Map<string, { deliverable: boolean; at: number }>();

export function clearMailDomainCache(): void {
  cache.clear();
}

function isMissingRecord(error: unknown): boolean {
  return NO_RECORD.has((error as NodeJS.ErrnoException)?.code ?? '');
}

export function domainOf(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/**
 * Whether a domain could receive mail at all.
 *
 * Says nothing about the mailbox — nobody@gmail.com passes. It only rules out
 * domains that can never be verified or sent a reset, which is most of what a
 * typo produces.
 *
 * Fails open on anything that is not a clean "no such record": a flaky
 * resolver must not take signup down with it. One dead account costs less
 * than the whole funnel.
 */
export async function domainCanReceiveMail(
  domain: string,
  resolver: DnsResolver = NODE_RESOLVER,
): Promise<boolean> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.deliverable;
  }

  const deliverable = await withTimeout(lookup(domain, resolver));
  cache.set(domain, { deliverable, at: Date.now() });
  return deliverable;
}

async function lookup(domain: string, resolver: DnsResolver): Promise<boolean> {
  try {
    const mx = await resolver.resolveMx(domain);
    if (mx.length > 0) return true;
  } catch (error) {
    if (!isMissingRecord(error)) return true;
  }

  // RFC 5321: a domain with an address record and no MX is still a mail
  // destination, and a few small domains still rely on that.
  try {
    const a = await resolver.resolve4(domain);
    return a.length > 0;
  } catch (error) {
    return !isMissingRecord(error);
  }
}

/** The signup request waits on this, so it cannot wait long. */
function withTimeout(check: Promise<boolean>): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(true), LOOKUP_TIMEOUT_MS);
    void check
      .then((deliverable) => resolve(deliverable))
      .catch(() => resolve(true))
      .finally(() => clearTimeout(timer));
  });
}
