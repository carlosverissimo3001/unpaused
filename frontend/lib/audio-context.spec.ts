/**
 * The states that matter here are the ones WebKit adds. A context parked at
 * `interrupted` accepts everything scheduled against it and plays none of it,
 * so being handed one back is indistinguishable from working until nobody can
 * hear anything.
 */

interface FakeContext {
  state: string;
  resume: jest.Mock;
  close: jest.Mock;
}

function makeContext(
  state: string,
  onResume?: (self: FakeContext) => void,
): FakeContext {
  const context: FakeContext = {
    state,
    resume: jest.fn(() => {
      onResume?.(context);
      return Promise.resolve();
    }),
    close: jest.fn(() => Promise.resolve()),
  };
  return context;
}

/**
 * Fresh module registry per test: the context is a module-level singleton, and
 * the point of most of these is what happens to the one already cached.
 *
 * The suite runs under the node environment, so `window` is stood up by hand
 * rather than pulling in jsdom for one global.
 */
async function load(contexts: FakeContext[]) {
  jest.resetModules();
  const made: FakeContext[] = [];
  (globalThis as unknown as { window: unknown }).window = {
    AudioContext: jest.fn(() => {
      const next = contexts[made.length];
      made.push(next);
      return next;
    }),
  };
  const mod = await import('./audio-context');
  return { ...mod, made };
}

afterAll(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('resumeAudioContext', () => {
  it('returns a context that is already running', async () => {
    const running = makeContext('running');
    const { resumeAudioContext } = await load([running]);

    await expect(resumeAudioContext()).resolves.toBe(running);
    expect(running.resume).not.toHaveBeenCalled();
  });

  it('resumes a suspended context', async () => {
    const suspended = makeContext('suspended', (self) => {
      self.state = 'running';
    });
    const { resumeAudioContext } = await load([suspended]);

    await expect(resumeAudioContext()).resolves.toBe(suspended);
    expect(suspended.resume).toHaveBeenCalled();
  });

  it('replaces a context stuck interrupted rather than handing it back', async () => {
    // WebKit resolves resume() here without ever reaching running.
    const stuck = makeContext('interrupted');
    const fresh = makeContext('interrupted', (self) => {
      self.state = 'running';
    });
    const { resumeAudioContext } = await load([stuck, fresh]);

    await expect(resumeAudioContext()).resolves.toBe(fresh);
    expect(stuck.close).toHaveBeenCalled();
  });

  it('rebuilds when resume throws', async () => {
    const broken = makeContext('suspended');
    broken.resume.mockRejectedValue(new Error('no'));
    const fresh = makeContext('suspended', (self) => {
      self.state = 'running';
    });
    const { resumeAudioContext } = await load([broken, fresh]);

    await expect(resumeAudioContext()).resolves.toBe(fresh);
  });

  it('answers null when even a fresh context will not run', async () => {
    // Silence the caller can fall back from, rather than silence it trusts.
    const stuck = makeContext('interrupted');
    const alsoStuck = makeContext('interrupted');
    const { resumeAudioContext } = await load([stuck, alsoStuck]);

    await expect(resumeAudioContext()).resolves.toBeNull();
  });

  it('does not keep handing out a context it already closed', async () => {
    const stuck = makeContext('interrupted');
    const fresh = makeContext('interrupted', (self) => {
      self.state = 'running';
    });
    const { resumeAudioContext, getAudioContext } = await load([stuck, fresh]);

    await resumeAudioContext();

    expect(getAudioContext()).toBe(fresh);
  });
});
