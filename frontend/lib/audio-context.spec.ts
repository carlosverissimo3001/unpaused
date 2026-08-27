/**
 * The states that matter are the ones a single sample gets wrong. `resume()`
 * resolving does not mean the context is running yet, and a context parked at
 * WebKit's `interrupted` accepts everything scheduled against it and plays
 * none of it — so both "still settling" and "never will" look identical for a
 * moment, and only one of them is worth throwing a context away over.
 */

interface FakeContext {
  state: string;
  resume: jest.Mock;
  close: jest.Mock;
  createBuffer: jest.Mock;
  createBufferSource: jest.Mock;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  destination: unknown;
  /** Silent unlock buffers started against this context. */
  starts: number;
  /** Fires the statechange listeners, as the browser would. */
  emit: () => void;
}

function makeContext(
  state: string,
  onResume?: (self: FakeContext) => void,
): FakeContext {
  const listeners = new Set<() => void>();

  const context: FakeContext = {
    state,
    resume: jest.fn(() => {
      onResume?.(context);
      return Promise.resolve();
    }),
    close: jest.fn(() => Promise.resolve()),
    createBuffer: jest.fn(() => ({})),
    createBufferSource: jest.fn(() => ({
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(() => {
        context.starts++;
      }),
    })),
    addEventListener: jest.fn((_: string, fn: () => void) => listeners.add(fn)),
    removeEventListener: jest.fn((_: string, fn: () => void) =>
      listeners.delete(fn),
    ),
    destination: {},
    starts: 0,
    emit: () => listeners.forEach((fn) => fn()),
  };
  return context;
}

/**
 * Fresh module registry per test: the context is a module-level singleton, and
 * most of these are about what happens to the one already cached.
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
  return import('./audio-context');
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

  it('waits for a context that is still settling rather than replacing it', async () => {
    // Chrome resolves resume() a beat before the state catches up. Acting on
    // that first reading throws away a context that was about to work, and the
    // replacement's first snippet is the one nobody hears.
    const slow = makeContext('suspended');
    slow.resume.mockImplementation(() => {
      setTimeout(() => {
        slow.state = 'running';
        slow.emit();
      }, 10);
      return Promise.resolve();
    });
    const { resumeAudioContext } = await load([slow]);

    await expect(resumeAudioContext()).resolves.toBe(slow);
    expect(slow.close).not.toHaveBeenCalled();
  });

  it('replaces a context stuck interrupted once it has had its chance', async () => {
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

  it('starts the hardware once, not on every play', async () => {
    // The clock does not advance until something has played, so the first real
    // snippet is dropped and its `ended` never arrives — which is what leaves
    // the button stuck showing pause.
    const running = makeContext('running');
    const { resumeAudioContext } = await load([running]);

    await resumeAudioContext();
    await resumeAudioContext();
    await resumeAudioContext();

    expect(running.starts).toBe(1);
  });

  it('starts the hardware again on a context it had to rebuild', async () => {
    const stuck = makeContext('interrupted');
    const fresh = makeContext('interrupted', (self) => {
      self.state = 'running';
    });
    const { resumeAudioContext } = await load([stuck, fresh]);

    await resumeAudioContext();

    expect(fresh.starts).toBe(1);
  });

  it('does not start hardware on a context it is about to reject', async () => {
    const stuck = makeContext('interrupted');
    const alsoStuck = makeContext('interrupted');
    const { resumeAudioContext } = await load([stuck, alsoStuck]);

    await resumeAudioContext();

    expect(stuck.starts).toBe(0);
    expect(alsoStuck.starts).toBe(0);
  });
});
