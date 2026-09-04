import {
  clearMailDomainCache,
  domainCanReceiveMail,
  domainOf,
  type DnsResolver,
} from './mail-domain';

const dnsError = (code: string) =>
  Object.assign(new Error(code), { code }) as NodeJS.ErrnoException;

const resolver = (overrides: Partial<DnsResolver> = {}): DnsResolver => ({
  resolveMx: jest.fn().mockResolvedValue([]),
  resolve4: jest.fn().mockResolvedValue([]),
  ...overrides,
});

beforeEach(() => clearMailDomainCache());

describe('domainOf', () => {
  it('takes the part after the last @', () => {
    expect(domainOf('carlos@gmail.com')).toBe('gmail.com');
    expect(domainOf('odd@name@example.org')).toBe('example.org');
  });

  it('lowercases, since DNS does not care but the cache key does', () => {
    expect(domainOf('Carlos@GMAIL.com')).toBe('gmail.com');
  });

  it('has nothing to say about a malformed address', () => {
    expect(domainOf('no-at-sign')).toBeNull();
    expect(domainOf('@leading')).toBeNull();
    expect(domainOf('trailing@')).toBeNull();
  });
});

describe('domainCanReceiveMail', () => {
  it('accepts a domain with a mail exchanger', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockResolvedValue([{ exchange: 'mx.gmail.com' }]),
    });

    await expect(domainCanReceiveMail('gmail.com', dns)).resolves.toBe(true);
    expect(dns.resolve4).not.toHaveBeenCalled();
  });

  it('refuses a domain that does not exist', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockRejectedValue(dnsError('ENOTFOUND')),
      resolve4: jest.fn().mockRejectedValue(dnsError('ENOTFOUND')),
    });

    await expect(domainCanReceiveMail('gmial.con', dns)).resolves.toBe(false);
  });

  it('accepts an address record without an MX, as the RFC allows', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockRejectedValue(dnsError('ENODATA')),
      resolve4: jest.fn().mockResolvedValue(['203.0.113.10']),
    });

    await expect(domainCanReceiveMail('small.example', dns)).resolves.toBe(
      true,
    );
  });

  it('refuses a domain that resolves to nothing at all', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockRejectedValue(dnsError('ENODATA')),
      resolve4: jest.fn().mockRejectedValue(dnsError('ENODATA')),
    });

    await expect(domainCanReceiveMail('empty.example', dns)).resolves.toBe(
      false,
    );
  });

  it.each(['ETIMEOUT', 'ESERVFAIL', 'ECONNREFUSED'])(
    'fails open on %s rather than taking signup down',
    async (code) => {
      const dns = resolver({
        resolveMx: jest.fn().mockRejectedValue(dnsError(code)),
      });

      await expect(domainCanReceiveMail('gmail.com', dns)).resolves.toBe(true);
    },
  );

  it('asks DNS once per domain, then answers from the cache', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockResolvedValue([{ exchange: 'mx.gmail.com' }]),
    });

    await domainCanReceiveMail('gmail.com', dns);
    await domainCanReceiveMail('gmail.com', dns);
    await domainCanReceiveMail('gmail.com', dns);

    expect(dns.resolveMx).toHaveBeenCalledTimes(1);
  });

  it('caches a refusal too, so a typo is not looked up repeatedly', async () => {
    const dns = resolver({
      resolveMx: jest.fn().mockRejectedValue(dnsError('ENOTFOUND')),
      resolve4: jest.fn().mockRejectedValue(dnsError('ENOTFOUND')),
    });

    await expect(domainCanReceiveMail('gmial.con', dns)).resolves.toBe(false);
    await expect(domainCanReceiveMail('gmial.con', dns)).resolves.toBe(false);

    expect(dns.resolveMx).toHaveBeenCalledTimes(1);
  });

  it('keeps domains apart in the cache', async () => {
    const dns = resolver({
      resolveMx: jest
        .fn()
        .mockResolvedValueOnce([{ exchange: 'mx.gmail.com' }])
        .mockRejectedValueOnce(dnsError('ENOTFOUND')),
      resolve4: jest.fn().mockRejectedValue(dnsError('ENOTFOUND')),
    });

    await expect(domainCanReceiveMail('gmail.com', dns)).resolves.toBe(true);
    await expect(domainCanReceiveMail('gmial.con', dns)).resolves.toBe(false);
  });

  it('fails open when the resolver never answers', async () => {
    jest.useFakeTimers();
    const dns = resolver({
      resolveMx: jest.fn().mockReturnValue(new Promise(() => {})),
    });

    const pending = domainCanReceiveMail('slow.example', dns);
    jest.advanceTimersByTime(2_000);

    await expect(pending).resolves.toBe(true);
    jest.useRealTimers();
  });
});
