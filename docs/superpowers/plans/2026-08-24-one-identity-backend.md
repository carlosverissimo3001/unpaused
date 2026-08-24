# One Identity For Everyone — Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone play a full round without logging in, by making the `User` row the identity and Spotify an optional credential attached to it.

**Architecture:** `User.spotifyUserId` becomes nullable, and the Redis session is re-keyed from `spotifyUserId` onto `User.id`. A visitor who starts a round is given a real `User` row with a generated display name and a session cookie. The parallel `src/guest/` identity system is then deleted. When a guest later signs in to a Spotify account that already has a row, the two rows are merged in one transaction.

**Tech Stack:** NestJS 10, Prisma 7 / PostgreSQL, Redis, Jest + ts-jest (`*.spec.ts` colocated under `src/`), oxlint, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-24-guest-as-user-design.md`

## Scope

Backend only (CAR-189). The spec's *Naming* and *Attaching credentials* sections also describe frontend prompts — the name field in the multiplayer join form, the streak-≥3 credentials prompt, the profile entry point. Those are frontend work sitting on top of CAR-188 and get a separate plan. This plan delivers the identity model they will need.

## Global Constraints

- All Prisma access goes through `PrismaService` (the transaction-aware proxy), never a raw `PrismaClient`. Multi-write operations use the `@Transactional()` decorator from `@transaction/transactional.decorator`.
- Services stay vendor-agnostic in naming. `spotifyUserId` may only appear in code that actually talks to the Spotify API.
- No constants files inside `services/` folders — constants live in a module-level `consts.ts` (or the existing `src/consts.ts`).
- Comments are sparse: at most one line, and only for non-obvious *why*. Reasoning belongs in the commit message.
- This is a public repository. Commit messages and code comments carry no private context.
- Stage explicit paths in every `git add`. Never `git add -A` or `git add .`.
- Tests are colocated as `src/**/*.spec.ts` and follow the existing idiom in `src/streak/services/streak.service.spec.ts`: `Test.createTestingModule`, hand-rolled mock objects, and `// ── Section ───` banner comments.
- `isTrusted` and `streakFreezes` are never granted by any code path in this plan. They are set manually in the database and via the admin UI.

## Interface Summary

Names later tasks depend on, defined once here:

```ts
// Task 2 — src/auth/utils/handle-generator.ts
export function generateHandle(): string;

// Task 3 — src/auth/dto/user-session.dto.ts
class UserSessionDto {
  sessionId: string;
  userId: string;
  spotifyUserId?: string;
  displayName: string;
  isTrusted: boolean;
  createdAt: number;
}

// Task 3 — src/auth/services/session.service.ts
export interface CreateSessionParams {
  userId: string;
  displayName: string;
  isTrusted: boolean;
  spotifyUserId?: string;
}
class SessionService {
  createSession(params: CreateSessionParams): Promise<string>;
  refreshUserSessionMapping(userId: string, sessionId: string): Promise<void>;
  getSessionIdByUserId(userId: string): Promise<string | null>;
}

// Task 5 — src/auth/repositories/user.repository.ts
class UserRepository {
  createAnonymous(displayName: string): Promise<UserEntity>;
  attachSpotify(userId: string, data: AttachSpotifyDto): Promise<UserEntity>;
}

// Task 5 — src/utils/guards/provisioning-session.guard.ts
export class ProvisioningSessionGuard implements CanActivate {}

// Task 5 — src/utils/guards/spotify-linked.guard.ts
export class SpotifyLinkedGuard implements CanActivate {}

// Task 7 — src/auth/services/account-merge.service.ts
class AccountMergeService {
  merge(sourceUserId: string, survivorUserId: string): Promise<void>;
}
```

---

### Task 1: Make `spotifyUserId` nullable

Widening a `NOT NULL` constraint. Existing rows stay valid, so the migration is not destructive — but it is the users table, so the backup step is not optional.

**Files:**
- Modify: `backend/prisma/schema.prisma` (`model User`, the `spotifyUserId` line)
- Modify: `backend/src/auth/entities/user.entity.ts:8-9`
- Create: `backend/prisma/migrations/<timestamp>_nullable_spotify_user_id/migration.sql` (generated)

**Interfaces:**
- Consumes: nothing.
- Produces: `UserEntity.spotifyUserId?: string` — every later task depends on this being optional.

- [ ] **Step 1: Back up production**

Take a dump of the production database before generating the migration. Do not proceed until it has completed and the file is non-empty.

- [ ] **Step 2: Edit the schema**

In `backend/prisma/schema.prisma`, `model User`:

```prisma
  spotifyUserId         String?      @unique @map("spotify_user_id")
```

Postgres permits many `NULL`s under a unique index, so `@unique` keeps holding for real Spotify ids and constrains guests not at all.

- [ ] **Step 3: Generate and apply the migration**

Run: `cd backend && pnpm prisma:migrate --name nullable_spotify_user_id`
Expected: a migration containing `ALTER TABLE "users" ALTER COLUMN "spotify_user_id" DROP NOT NULL;` and nothing destructive. Read the generated SQL before accepting it.

- [ ] **Step 4: Make the entity match**

In `backend/src/auth/entities/user.entity.ts`, replace the `spotifyUserId` property:

```ts
  @ApiPropertyOptional({
    description: 'Unique identifier for the user on Spotify, when linked',
  })
  spotifyUserId?: string;
```

Then in `backend/src/auth/repositories/user.repository.ts`, extend `fromPrisma` to normalise the new null:

```ts
  private fromPrisma(user: PrismaUser): UserEntity {
    return {
      ...user,
      spotifyUserId: user.spotifyUserId ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      customAvatarUrl: user.customAvatarUrl ?? undefined,
      country: user.country ?? undefined,
    };
  }
```

- [ ] **Step 5: Typecheck and see the blast radius**

Run: `cd backend && pnpm exec tsc --noEmit`
Expected: FAIL, with errors everywhere a `string` was assumed. That list is the work of Tasks 3 and 4 — read it, do not fix it here.

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations backend/src/auth/entities/user.entity.ts backend/src/auth/repositories/user.repository.ts
git commit -m "feat(auth): let a user exist without Spotify"
```

---

### Task 2: Generated display names

A new row needs a name immediately so it is never blank in a room or on a leaderboard. Two words in the app's own register, not `Guest_8f21`.

**Files:**
- Create: `backend/src/auth/utils/handle-generator.ts`
- Test: `backend/src/auth/utils/handle-generator.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `generateHandle(): string` — used by Task 5.

- [ ] **Step 1: Write the failing test**

Create `backend/src/auth/utils/handle-generator.spec.ts`:

```ts
import { generateHandle, ADJECTIVES, NOUNS } from './handle-generator';

// ── Tests ────────────────────────────────────────────────────────────

describe('generateHandle', () => {
  it('returns two words drawn from the word lists', () => {
    const [adjective, noun, ...rest] = generateHandle().split(' ');

    expect(rest).toHaveLength(0);
    expect(ADJECTIVES).toContain(adjective);
    expect(NOUNS).toContain(noun);
  });

  it('does not always return the same handle', () => {
    const handles = new Set(
      Array.from({ length: 50 }, () => generateHandle()),
    );

    expect(handles.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- handle-generator`
Expected: FAIL — `Cannot find module './handle-generator'`.

- [ ] **Step 3: Write the implementation**

Create `backend/src/auth/utils/handle-generator.ts`:

```ts
export const ADJECTIVES = [
  'Acoustic', 'Analog', 'Brass', 'Distant', 'Electric', 'Golden',
  'Hazy', 'Loud', 'Midnight', 'Neon', 'Quiet', 'Reverb',
  'Slow', 'Static', 'Sunlit', 'Velvet', 'Vinyl', 'Warm',
] as const;

export const NOUNS = [
  'Bassline', 'Bridge', 'Chorus', 'Crescendo', 'Demo', 'Encore',
  'Fader', 'Hook', 'Intro', 'Needle', 'Outro', 'Refrain',
  'Riff', 'Sample', 'Sleeve', 'Tempo', 'Verse', 'Vocal',
] as const;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateHandle(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}
```

324 combinations. Collisions are fine — `displayName` is not unique, and the first conversion ask is for a real name anyway.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pnpm test -- handle-generator`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/auth/utils/handle-generator.ts backend/src/auth/utils/handle-generator.spec.ts
git commit -m "feat(auth): generate a display name for a new user"
```

---

### Task 3: Re-key the session on `User.id`

The session is currently built around `spotifyUserId`: it is a required field on the DTO, the first argument to `createSession`, the key of the reverse mapping, and what `SessionGuard` refreshes. A guest has none of it.

**Files:**
- Modify: `backend/src/auth/dto/user-session.dto.ts`
- Modify: `backend/src/auth/services/session.service.ts`
- Modify: `backend/src/utils/guards/session-guard.ts:20-24`
- Test: `backend/src/auth/services/session.service.spec.ts` (create)

**Interfaces:**
- Consumes: `UserEntity.spotifyUserId?` (Task 1).
- Produces: `CreateSessionParams`, `SessionService.createSession(params)`, `refreshUserSessionMapping(userId, sessionId)`, `getSessionIdByUserId(userId)`, and `UserSessionDto.userId`. Tasks 4, 5, 6 and 8 all depend on these.

- [ ] **Step 1: Write the failing test**

Create `backend/src/auth/services/session.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { RedisService } from '../../redis/redis.service';
import { UserSessionDto } from '../dto/user-session.dto';

// ── Constants ────────────────────────────────────────────────────────

const USER_ID = 'user-1';

// ── Mocks ────────────────────────────────────────────────────────────

const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
};

const mockConfigService = { get: jest.fn().mockReturnValue(604800) };

// ── Tests ────────────────────────────────────────────────────────────

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get<SessionService>(SessionService);
  });

  it('creates a session for a user with no Spotify link', async () => {
    const sessionId = await service.createSession({
      userId: USER_ID,
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });

    const written = mockRedisService.set.mock.calls.find(([key]) =>
      key === `session:${sessionId}`,
    );
    const session = JSON.parse(written[1] as string) as UserSessionDto;

    expect(session.userId).toBe(USER_ID);
    expect(session.spotifyUserId).toBeUndefined();
  });

  it('keys the reverse mapping on the user id, not the Spotify id', async () => {
    const sessionId = await service.createSession({
      userId: USER_ID,
      displayName: 'Vinyl Chorus',
      isTrusted: false,
      spotifyUserId: 'spotify-1',
    });

    expect(mockRedisService.set).toHaveBeenCalledWith(
      `user-session:${USER_ID}`,
      sessionId,
      604800,
    );
    expect(mockRedisService.set).not.toHaveBeenCalledWith(
      'user-session:spotify-1',
      expect.anything(),
      expect.anything(),
    );
  });

  it('looks a session up by user id', async () => {
    mockRedisService.get.mockResolvedValue('session-1');
    mockRedisService.exists.mockResolvedValue(true);

    await expect(service.getSessionIdByUserId(USER_ID)).resolves.toBe(
      'session-1',
    );
    expect(mockRedisService.get).toHaveBeenCalledWith(
      `user-session:${USER_ID}`,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- session.service`
Expected: FAIL — `createSession` still takes positional arguments, and `getSessionIdByUserId` does not exist.

- [ ] **Step 3: Widen the session DTO**

In `backend/src/auth/dto/user-session.dto.ts`, replace the `spotifyUserId` property and add `userId` above it:

```ts
  @ApiProperty({ description: 'Identifier of the user this session belongs to' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Spotify user ID, present only when the account is linked',
  })
  @IsOptional()
  @IsString()
  spotifyUserId?: string;
```

Add `ApiPropertyOptional` to the `@nestjs/swagger` import and `IsOptional` to the `class-validator` import.

- [ ] **Step 4: Re-key the session service**

In `backend/src/auth/services/session.service.ts`, export the params type and rewrite the four affected methods:

```ts
export interface CreateSessionParams {
  userId: string;
  displayName: string;
  isTrusted: boolean;
  spotifyUserId?: string;
}
```

```ts
  async createSession(params: CreateSessionParams): Promise<string> {
    const sessionId = uuidv4();

    const session: UserSessionDto = {
      sessionId,
      userId: params.userId,
      spotifyUserId: params.spotifyUserId,
      displayName: params.displayName,
      isTrusted: params.isTrusted,
      createdAt: Date.now(),
    };

    await this.redisService.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      this.sessionMaxAge,
    );

    await this.redisService.set(
      `user-session:${params.userId}`,
      sessionId,
      this.sessionMaxAge,
    );

    return sessionId;
  }
```

```ts
  async refreshUserSessionMapping(
    userId: string,
    sessionId: string,
  ): Promise<void> {
    await this.redisService.set(
      `user-session:${userId}`,
      sessionId,
      this.sessionMaxAge,
    );
  }

  async getSessionIdByUserId(userId: string): Promise<string | null> {
    const sessionId = await this.redisService.get(`user-session:${userId}`);
    if (!sessionId) {
      return null;
    }

    const exists = await this.redisService.exists(`session:${sessionId}`);
    if (!exists) {
      await this.redisService.del(`user-session:${userId}`);
      return null;
    }

    return sessionId;
  }
```

In `deleteSession`, change the reverse-mapping key from `session.spotifyUserId` to `session.userId`. Delete the old `getSessionIdBySpotifyUserId` method entirely — Task 4 moves its one caller.

- [ ] **Step 5: Update `SessionGuard`**

In `backend/src/utils/guards/session-guard.ts`, replace the refresh call:

```ts
    const session = await this.sessionService.getSession(sessionId);
    await this.sessionService.refreshUserSessionMapping(
      session.userId,
      sessionId,
    );
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && pnpm test -- session.service`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add backend/src/auth/dto/user-session.dto.ts backend/src/auth/services/session.service.ts backend/src/auth/services/session.service.spec.ts backend/src/utils/guards/session-guard.ts
git commit -m "feat(auth): key the session on the user, not on Spotify"
```

---

### Task 4: Move identity call sites off `spotifyUserId`

`spotifyUserId` appears 97 times across 21 files. Each use is one of two kinds, and the whole task is telling them apart:

- **Identity** — "who is asking". Switches to `userId`.
- **Credential** — an argument to a Spotify API call. Stays, and its call site now sits behind a guard that guarantees it is present.

**Files:**
- Modify: `backend/src/auth/services/auth.service.ts` (`getUserBySessionId:145-150`, `getCurrentUser:89-110`, `getValidAccessToken:125-135`, `updateProfile:172-181`, `logout:192-196`)
- Modify: `backend/src/multiplayer/services/track-pool.service.ts`
- Modify: `backend/src/multiplayer/repositories/room.repository.ts`
- Modify: `backend/src/playlist/services/playlist.service.ts`
- Modify: `backend/src/playlist/utils/playlist-utils.ts`
- Modify: `backend/src/admin/dto/admin-user.dto.ts`
- Test: `backend/src/multiplayer/services/track-pool.service.spec.ts`, `backend/src/streak/services/streak.service.spec.ts`, `backend/src/admin/services/admin-user.service.spec.ts` (existing, update fixtures)

**Interfaces:**
- Consumes: `UserSessionDto.userId`, `getSessionIdByUserId` (Task 3).
- Produces: `AuthService.getUserBySessionId` now resolves via `User.id`. No signature changes.

- [ ] **Step 1: Let the typechecker enumerate the work**

Run: `cd backend && pnpm exec tsc --noEmit 2>&1 | tee /tmp/identity-errors.txt`
Expected: FAIL. Every error is a site to classify. Work the list top to bottom.

- [ ] **Step 2: Fix `getUserBySessionId` — the central one**

In `backend/src/auth/services/auth.service.ts`, this currently resolves the session then looks the user up by Spotify id. It becomes a direct lookup:

```ts
  async getUserBySessionId(sessionId: string): Promise<User> {
    const session = await this.sessionService.getSession(sessionId);
    return this.getUserById(session.userId);
  }
```

- [ ] **Step 3: Classify the rest**

For each remaining error:

- If the value is passed to `SpotifyAuthService`, `SpotifyService`, or any `@spotify/web-api-ts-sdk` call, it is a **credential**. Keep `spotifyUserId`, and read it as `session.spotifyUserId`. Where the compiler now objects that it may be `undefined`, throw:

```ts
    if (!session.spotifyUserId) {
      throw new ForbiddenException('This action requires a linked Spotify account');
    }
```

  Task 5 puts `SpotifyLinkedGuard` in front of these routes so the throw is a backstop, not the user-facing path.

- Otherwise it is **identity**. Replace the parameter and its call sites with `userId`, and rename the local variable to match. In `TrackPoolService`, the reverse lookup becomes `getSessionIdByUserId(userId)`.

- [ ] **Step 4: Update the existing test fixtures**

`streak.service.spec.ts`, `track-pool.service.spec.ts` and `admin-user.service.spec.ts` build user and session fixtures containing `spotifyUserId`. Add `userId` where the fixture represents a session, and leave `spotifyUserId` on fixtures that represent a linked account. Do not delete either field — the point of the model is that both can be present.

- [ ] **Step 5: Run the full suite and the typechecker**

Run: `cd backend && pnpm exec tsc --noEmit && pnpm test`
Expected: both PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src
git commit -m "refactor(auth): identify callers by user id, not Spotify id"
```

---

### Task 5: Provision a user on first round

Three guards, because there are now three distinct questions a route can ask:

| Guard | Question | Behaviour when the answer is no |
|---|---|---|
| `ProvisioningSessionGuard` | none — everyone may play | creates a `User` row and a session, sets the cookie |
| `SessionGuard` (existing) | is there a session? | 401 |
| `SpotifyLinkedGuard` | is Spotify linked? | 403 |

Rows are created **on first round start, not first page load** — a crawler hitting the landing page must not create a `User`. That is enforced by which routes carry `ProvisioningSessionGuard`.

**Files:**
- Modify: `backend/src/auth/repositories/user.repository.ts`
- Create: `backend/src/auth/dto/attach-spotify.dto.ts`
- Create: `backend/src/utils/guards/provisioning-session.guard.ts`
- Create: `backend/src/utils/guards/spotify-linked.guard.ts`
- Test: `backend/src/utils/guards/provisioning-session.guard.spec.ts`

**Interfaces:**
- Consumes: `generateHandle()` (Task 2); `CreateSessionParams` (Task 3).
- Produces: `UserRepository.createAnonymous`, `UserRepository.attachSpotify`, `ProvisioningSessionGuard`, `SpotifyLinkedGuard`. Tasks 6 and 8 depend on these.

- [ ] **Step 1: Write the failing test**

Create `backend/src/utils/guards/provisioning-session.guard.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { ProvisioningSessionGuard } from './provisioning-session.guard';
import { SessionService } from '@auth/services/session.service';
import { UserRepository } from '@auth/repositories/user.repository';
import { SESSION_COOKIE_NAME } from '../../consts';

// ── Mocks ────────────────────────────────────────────────────────────

const mockSessionService = {
  getSession: jest.fn(),
  createSession: jest.fn(),
  refreshUserSessionMapping: jest.fn(),
};

const mockUserRepository = { createAnonymous: jest.fn() };

function makeContext(cookies: Record<string, string>) {
  const response = { cookie: jest.fn() };
  const request = { cookies };
  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext,
    request,
    response,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe('ProvisioningSessionGuard', () => {
  let guard: ProvisioningSessionGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvisioningSessionGuard,
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();
    guard = module.get(ProvisioningSessionGuard);
  });

  it('creates exactly one user when there is no cookie', async () => {
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-1',
      displayName: 'Vinyl Chorus',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-1');
    const { context, response } = makeContext({});

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).toHaveBeenCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith(
      SESSION_COOKIE_NAME,
      'session-1',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('creates no user when the cookie resolves to a live session', async () => {
    mockSessionService.getSession.mockResolvedValue({
      sessionId: 'session-1',
      userId: 'user-1',
    });
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'session-1' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).not.toHaveBeenCalled();
  });

  it('provisions a fresh user when the cookie is stale', async () => {
    mockSessionService.getSession.mockRejectedValue(new Error('expired'));
    mockUserRepository.createAnonymous.mockResolvedValue({
      id: 'user-2',
      displayName: 'Neon Riff',
      isTrusted: false,
    });
    mockSessionService.createSession.mockResolvedValue('session-2');
    const { context } = makeContext({ [SESSION_COOKIE_NAME]: 'gone' });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(mockUserRepository.createAnonymous).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- provisioning-session.guard`
Expected: FAIL — `Cannot find module './provisioning-session.guard'`.

- [ ] **Step 3: Add the repository methods**

Create `backend/src/auth/dto/attach-spotify.dto.ts`:

```ts
export class AttachSpotifyDto {
  spotifyUserId: string;
  avatarUrl?: string;
  country?: string;
}
```

In `backend/src/auth/repositories/user.repository.ts`, add:

```ts
  /** No credentials yet: what makes this row a guest is the absence of them. */
  async createAnonymous(displayName: string): Promise<UserEntity> {
    const user = await this.prismaService.user.create({
      data: { displayName },
    });
    return this.fromPrisma(user);
  }

  async attachSpotify(
    userId: string,
    data: AttachSpotifyDto,
  ): Promise<UserEntity> {
    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        spotifyUserId: data.spotifyUserId,
        avatarUrl: data.avatarUrl,
        country: data.country,
      },
    });
    return this.fromPrisma(user);
  }
```

`createAnonymous` sets no `isTrusted` and no `streakFreezes`, so both take their schema defaults of `false` and `0`.

- [ ] **Step 4: Write the guards**

Create `backend/src/utils/guards/provisioning-session.guard.ts`:

```ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { SessionService } from '@auth/services/session.service';
import { UserRepository } from '@auth/repositories/user.repository';
import { generateHandle } from '@auth/utils/handle-generator';
import { getCookieOptions } from '@auth/utils/http-helpers';
import { SESSION_COOKIE_NAME } from '../../consts';

/**
 * Self-provisioning, unlike SessionGuard: a missing or stale cookie mints a
 * real user rather than rejecting. Only routes that start a round carry it,
 * so a crawler on the landing page never creates a row.
 */
@Injectable()
export class ProvisioningSessionGuard implements CanActivate {
  private readonly sessionMaxAge = 604800;

  constructor(
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const existing = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (existing) {
      try {
        const session = await this.sessionService.getSession(existing);
        await this.sessionService.refreshUserSessionMapping(
          session.userId,
          existing,
        );
        return true;
      } catch {
        // Stale cookie: fall through and provision a fresh identity.
      }
    }

    const user = await this.userRepository.createAnonymous(generateHandle());
    const sessionId = await this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
    });

    response.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      getCookieOptions({ sessionMaxAge: this.sessionMaxAge }),
    );

    return true;
  }
}
```

Create `backend/src/utils/guards/spotify-linked.guard.ts`:

```ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '@auth/services/session.service';
import { SESSION_COOKIE_NAME } from '../../consts';

/** For the one thing Spotify still buys: playing your own library. */
@Injectable()
export class SpotifyLinkedGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!sessionId) {
      throw new UnauthorizedException('No active session found');
    }

    const session = await this.sessionService.getSession(sessionId);
    if (!session.spotifyUserId) {
      throw new ForbiddenException(
        'This action requires a linked Spotify account',
      );
    }

    return true;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pnpm test -- provisioning-session.guard`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/repositories/user.repository.ts backend/src/auth/dto/attach-spotify.dto.ts backend/src/utils/guards/provisioning-session.guard.ts backend/src/utils/guards/provisioning-session.guard.spec.ts backend/src/utils/guards/spotify-linked.guard.ts
git commit -m "feat(auth): give a first-time player an identity"
```

---

### Task 6: Retire the guest module

The parallel identity system exists only because `spotifyUserId` was `NOT NULL`. Task 1 removed that reason.

**Files:**
- Delete: `backend/src/guest/services/guest-session.service.ts`, `backend/src/guest/guards/guest-session.guard.ts`, `backend/src/guest/decorators/guestId.decorator.ts`, `backend/src/guest/services/guest-game.service.ts`, `backend/src/guest/controllers/guest-game.controller.ts`
- Modify: `backend/src/guest/guest.module.ts`, `backend/src/guest/guest.constants.ts`, `backend/src/guest/types.ts`
- Modify: `backend/src/app.module.ts` (guest module registration)
- Modify: the game controller — apply `ProvisioningSessionGuard` to round-start routes and `SpotifyLinkedGuard` to library-backed playlist routes

**Interfaces:**
- Consumes: `ProvisioningSessionGuard`, `SpotifyLinkedGuard` (Task 5).
- Produces: nothing new. Guest round endpoints are gone; clients use the normal game endpoints.

- [ ] **Step 1: Find every guest route the frontend calls**

Run: `cd frontend && grep -rn "guest" --include=*.ts --include=*.tsx app hooks lib components | grep -v sdk/`
Expected: a list of frontend call sites. Each must be repointed at the normal game endpoint in Step 5. Record the list before deleting anything.

- [ ] **Step 2: Move the pool constants out**

`GUEST_PLAYLIST_IDS`, `GUEST_PLAYLIST_TRACKS_CACHE_PREFIX`, `GUEST_PLAYLIST_TRACKS_CACHE_TTL` and `GUEST_MAX_PREVIEW_ATTEMPTS` are not about guests — they are how any player without a Spotify library gets something to play, which now includes email/password users. Move them to `backend/src/consts.ts`, renaming the `GUEST_` prefix to `POOL_`, and update importers.

Leave the `Replaced in CAR-177` comment on the playlist ids intact.

- [ ] **Step 3: Apply the guards to the game routes**

On the controller handling round start, replace `@UseGuards(GuestSessionGuard)` (or `SessionGuard`, whichever is present) with:

```ts
@UseGuards(ProvisioningSessionGuard)
```

On playlist routes that read the caller's own Spotify playlists or liked songs:

```ts
@UseGuards(SpotifyLinkedGuard)
```

Everything else keeps `SessionGuard`.

- [ ] **Step 4: Delete the guest identity code**

```bash
git rm backend/src/guest/services/guest-session.service.ts \
       backend/src/guest/guards/guest-session.guard.ts \
       backend/src/guest/decorators/guestId.decorator.ts \
       backend/src/guest/services/guest-game.service.ts \
       backend/src/guest/controllers/guest-game.controller.ts
```

Remove the corresponding providers and controllers from `guest.module.ts`. If nothing is left in it, delete the module and its registration in `app.module.ts` too. Remove the `guestId` augmentation from `guest/types.ts`, and `GUEST_COOKIE_NAME`, `GUEST_SESSION_TTL_SECONDS`, `GUEST_ROUND_TTL_SECONDS`, `GUEST_ROUND_KEY_PREFIX` and `GUEST_SESSION_KEY_PREFIX` from `guest.constants.ts`.

- [ ] **Step 5: Regenerate the SDK and repoint the frontend**

Run: `pnpm build:sdk` at the repo root. Never hand-edit files under `frontend/sdk/`.

Then update each frontend call site from Step 1 to use the normal game hooks. The guest-specific hooks delete.

- [ ] **Step 6: Verify**

Run: `cd backend && pnpm exec tsc --noEmit && pnpm test && pnpm lint`
Run: `cd frontend && pnpm exec tsc --noEmit`
Expected: all PASS. `grep -rn "guestId\|GUEST_SESSION" backend/src` returns nothing.

- [ ] **Step 7: Commit**

```bash
git add backend/src frontend/sdk frontend/app frontend/hooks frontend/components backend/src/consts.ts
git commit -m "refactor(guest): fold the guest identity into the user model"
```

---

### Task 7: Merge two accounts

The highest-risk piece in the plan, and the one that gets the most coverage. Discarding the guest row would be simpler, but it destroys exactly what the conversion prompt promised to protect, at the moment the user is trusting it.

**Files:**
- Create: `backend/src/auth/services/account-merge.service.ts`
- Test: `backend/src/auth/services/account-merge.service.spec.ts`
- Modify: `backend/src/auth/auth.module.ts` (register the provider)

**Interfaces:**
- Consumes: `PrismaService`, `@Transactional()`.
- Produces: `AccountMergeService.merge(sourceUserId, survivorUserId): Promise<void>`. Task 8 calls it.

- [ ] **Step 1: Write the failing test**

Create `backend/src/auth/services/account-merge.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { GameMode } from '@prisma/client';
import { AccountMergeService } from './account-merge.service';
import { PrismaService } from '@prisma/prisma.service';

// ── Constants ────────────────────────────────────────────────────────

const SOURCE = 'guest-user';
const SURVIVOR = 'spotify-user';

// ── Factories ────────────────────────────────────────────────────────

function makeStats(userId: string, overrides = {}) {
  return {
    userId,
    mode: GameMode.DAILY,
    currentStreak: 1,
    bestStreak: 1,
    totalGames: 1,
    totalWins: 1,
    roundDistribution: [1, 0, 0, 0, 0, 0, 0],
    lastWinDate: new Date('2026-01-01'),
    ...overrides,
  };
}

// ── Mocks ────────────────────────────────────────────────────────────

const mockPrismaService = {
  user: { findUniqueOrThrow: jest.fn(), update: jest.fn(), delete: jest.fn() },
  stats: { findMany: jest.fn(), update: jest.fn(), create: jest.fn() },
  gameSession: { updateMany: jest.fn() },
  gauntletRun: { updateMany: jest.fn() },
  roomPlayer: { findMany: jest.fn(), update: jest.fn(), delete: jest.fn() },
};

// ── Tests ────────────────────────────────────────────────────────────

describe('AccountMergeService', () => {
  let service: AccountMergeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.roomPlayer.findMany.mockResolvedValue([]);
    mockPrismaService.user.findUniqueOrThrow.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          answeredQuestionIds: where.id === SOURCE ? ['q1'] : ['q2'],
          streakFreezes: where.id === SOURCE ? 99 : 2,
          isTrusted: where.id === SOURCE,
        }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountMergeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();
    service = module.get(AccountMergeService);
  });

  it('sums totals and takes the higher streaks', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([
      makeStats(SOURCE, {
        totalGames: 6,
        totalWins: 5,
        currentStreak: 6,
        bestStreak: 6,
        roundDistribution: [1, 1, 1, 1, 1, 0, 0],
        lastWinDate: new Date('2026-02-01'),
      }),
      makeStats(SURVIVOR, {
        totalGames: 10,
        totalWins: 4,
        currentStreak: 2,
        bestStreak: 9,
        roundDistribution: [0, 2, 0, 1, 0, 1, 0],
        lastWinDate: new Date('2026-01-15'),
      }),
    ]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_mode: { userId: SURVIVOR, mode: GameMode.DAILY } },
        data: expect.objectContaining({
          totalGames: 16,
          totalWins: 9,
          currentStreak: 6,
          bestStreak: 9,
          roundDistribution: [1, 3, 1, 2, 1, 1, 0],
          lastWinDate: new Date('2026-02-01'),
        }),
      }),
    );
  });

  it('carries over a mode the survivor has never played', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([makeStats(SOURCE)]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.stats.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: SURVIVOR, mode: GameMode.DAILY }),
      }),
    );
  });

  it('never transfers isTrusted or streakFreezes from the source', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    const update = mockPrismaService.user.update.mock.calls.find(
      ([arg]) => arg.where.id === SURVIVOR,
    );
    expect(update[0].data).not.toHaveProperty('isTrusted');
    expect(update[0].data).not.toHaveProperty('streakFreezes');
  });

  it('unions the answered question ids', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    const update = mockPrismaService.user.update.mock.calls.find(
      ([arg]) => arg.where.id === SURVIVOR,
    );
    expect(update[0].data.answeredQuestionIds.sort()).toEqual(['q1', 'q2']);
  });

  it('drops a room membership the survivor already has', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);
    mockPrismaService.roomPlayer.findMany.mockImplementation(
      ({ where }: { where: { userId: string } }) =>
        Promise.resolve(
          where.userId === SOURCE
            ? [{ id: 'rp-1', roomId: 'room-1', userId: SOURCE }]
            : [{ id: 'rp-2', roomId: 'room-1', userId: SURVIVOR }],
        ),
    );

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.roomPlayer.delete).toHaveBeenCalledWith({
      where: { id: 'rp-1' },
    });
    expect(mockPrismaService.roomPlayer.update).not.toHaveBeenCalled();
  });

  it('deletes the source row last', async () => {
    mockPrismaService.stats.findMany.mockResolvedValue([]);

    await service.merge(SOURCE, SURVIVOR);

    expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
      where: { id: SOURCE },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- account-merge`
Expected: FAIL — `Cannot find module './account-merge.service'`.

- [ ] **Step 3: Write the implementation**

Create `backend/src/auth/services/account-merge.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Transactional } from '@transaction/transactional.decorator';

@Injectable()
export class AccountMergeService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Folds `sourceUserId` into `survivorUserId` and deletes the source. Nothing
   * the source carries may raise a privilege on the survivor.
   */
  @Transactional()
  async merge(sourceUserId: string, survivorUserId: string): Promise<void> {
    const [source, survivor] = await Promise.all([
      this.prismaService.user.findUniqueOrThrow({
        where: { id: sourceUserId },
      }),
      this.prismaService.user.findUniqueOrThrow({
        where: { id: survivorUserId },
      }),
    ]);

    await this.mergeStats(sourceUserId, survivorUserId);
    await this.mergeRoomPlayers(sourceUserId, survivorUserId);

    await this.prismaService.gameSession.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });
    await this.prismaService.gauntletRun.updateMany({
      where: { userId: sourceUserId },
      data: { userId: survivorUserId },
    });

    await this.prismaService.user.update({
      where: { id: survivorUserId },
      data: {
        answeredQuestionIds: Array.from(
          new Set([
            ...survivor.answeredQuestionIds,
            ...source.answeredQuestionIds,
          ]),
        ),
      },
    });

    await this.prismaService.user.delete({ where: { id: sourceUserId } });
  }

  private async mergeStats(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const rows = await this.prismaService.stats.findMany({
      where: { userId: { in: [sourceUserId, survivorUserId] } },
    });

    const sourceRows = rows.filter((row) => row.userId === sourceUserId);

    for (const from of sourceRows) {
      const into = rows.find(
        (row) => row.userId === survivorUserId && row.mode === from.mode,
      );

      if (!into) {
        await this.prismaService.stats.create({
          data: { ...from, userId: survivorUserId },
        });
        continue;
      }

      await this.prismaService.stats.update({
        where: { userId_mode: { userId: survivorUserId, mode: from.mode } },
        data: {
          totalGames: into.totalGames + from.totalGames,
          totalWins: into.totalWins + from.totalWins,
          currentStreak: Math.max(into.currentStreak, from.currentStreak),
          bestStreak: Math.max(into.bestStreak, from.bestStreak),
          roundDistribution: into.roundDistribution.map(
            (value, index) => value + (from.roundDistribution[index] ?? 0),
          ),
          lastWinDate: laterOf(into.lastWinDate, from.lastWinDate),
        },
      });
    }
  }

  /** A player cannot be in a room twice: @@unique([roomId, userId]). */
  private async mergeRoomPlayers(
    sourceUserId: string,
    survivorUserId: string,
  ): Promise<void> {
    const [sourceRows, survivorRows] = await Promise.all([
      this.prismaService.roomPlayer.findMany({
        where: { userId: sourceUserId },
      }),
      this.prismaService.roomPlayer.findMany({
        where: { userId: survivorUserId },
      }),
    ]);

    const occupied = new Set(survivorRows.map((row) => row.roomId));

    for (const row of sourceRows) {
      if (occupied.has(row.roomId)) {
        await this.prismaService.roomPlayer.delete({ where: { id: row.id } });
        continue;
      }
      await this.prismaService.roomPlayer.update({
        where: { id: row.id },
        data: { userId: survivorUserId },
      });
    }
  }
}

function laterOf(a: Date | null, b: Date | null): Date | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}
```

`isTrusted`, `isAdmin`, `streakFreezes` and `UserPreference` are absent from the survivor update by design: the survivor keeps its own, and the source row is deleted with `onDelete: Cascade` taking its preferences with it.

- [ ] **Step 4: Register the provider**

In `backend/src/auth/auth.module.ts`, add `AccountMergeService` to `providers` and to `exports`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && pnpm test -- account-merge`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/services/account-merge.service.ts backend/src/auth/services/account-merge.service.spec.ts backend/src/auth/auth.module.ts
git commit -m "feat(auth): merge a guest into the account it signs in to"
```

---

### Task 8: Wire the merge into the Spotify callback

Three cases at callback time, and the common one is the cheapest.

**Files:**
- Modify: `backend/src/auth/services/auth.service.ts:43-80` (`handleCallback`)
- Test: `backend/src/auth/services/auth.service.spec.ts` (create)

**Interfaces:**
- Consumes: `AccountMergeService.merge` (Task 7); `UserRepository.attachSpotify` (Task 5); `SessionService.createSession` (Task 3).
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

Create `backend/src/auth/services/auth.service.spec.ts` covering the three branches. `handleCallback` gains an optional current-session argument so it can see the guest that is signing in:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AccountMergeService } from './account-merge.service';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from './session.service';
import { SpotifyAuthService } from './spotify-auth.service';

// ── Constants ────────────────────────────────────────────────────────

const GUEST_ID = 'guest-user';
const EXISTING_ID = 'existing-user';
const SPOTIFY_ID = 'spotify-1';

// ── Mocks ────────────────────────────────────────────────────────────

const mockUserRepository = {
  findBySpotifyUserId: jest.fn(),
  findById: jest.fn(),
  attachSpotify: jest.fn(),
  upsert: jest.fn(),
};
const mockMergeService = { merge: jest.fn() };
const mockSessionService = {
  getSession: jest.fn(),
  createSession: jest.fn().mockResolvedValue('session-new'),
  consumePkceState: jest.fn().mockResolvedValue({ codeVerifier: 'v' }),
};
const mockSpotifyAuthService = {
  exchangeCode: jest.fn().mockResolvedValue({ refreshToken: 'r' }),
  getProfile: jest.fn().mockResolvedValue({ id: SPOTIFY_ID, display_name: 'X' }),
  storeTokens: jest.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────

describe('AuthService.handleCallback', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: AccountMergeService, useValue: mockMergeService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: SpotifyAuthService, useValue: mockSpotifyAuthService },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('attaches Spotify to the guest row when the account is new', async () => {
    mockSessionService.getSession.mockResolvedValue({ userId: GUEST_ID });
    mockUserRepository.findBySpotifyUserId.mockResolvedValue(null);
    mockUserRepository.findById.mockResolvedValue({ id: GUEST_ID });
    mockUserRepository.attachSpotify.mockResolvedValue({
      id: GUEST_ID,
      displayName: 'X',
      isTrusted: false,
    });

    await service.handleCallback('code', 'state', 'session-guest');

    expect(mockUserRepository.attachSpotify).toHaveBeenCalledWith(
      GUEST_ID,
      expect.objectContaining({ spotifyUserId: SPOTIFY_ID }),
    );
    expect(mockMergeService.merge).not.toHaveBeenCalled();
  });

  it('merges the guest into the existing account on collision', async () => {
    mockSessionService.getSession.mockResolvedValue({ userId: GUEST_ID });
    mockUserRepository.findBySpotifyUserId.mockResolvedValue({
      id: EXISTING_ID,
      displayName: 'X',
      isTrusted: false,
    });

    await service.handleCallback('code', 'state', 'session-guest');

    expect(mockMergeService.merge).toHaveBeenCalledWith(GUEST_ID, EXISTING_ID);
    expect(mockUserRepository.attachSpotify).not.toHaveBeenCalled();
  });

  it('does not merge a row into itself on an ordinary re-login', async () => {
    mockSessionService.getSession.mockResolvedValue({ userId: EXISTING_ID });
    mockUserRepository.findBySpotifyUserId.mockResolvedValue({
      id: EXISTING_ID,
      displayName: 'X',
      isTrusted: false,
    });

    await service.handleCallback('code', 'state', 'session-existing');

    expect(mockMergeService.merge).not.toHaveBeenCalled();
  });

  it('signs in normally when there is no current session', async () => {
    mockUserRepository.findBySpotifyUserId.mockResolvedValue({
      id: EXISTING_ID,
      displayName: 'X',
      isTrusted: false,
    });

    await service.handleCallback('code', 'state', undefined);

    expect(mockMergeService.merge).not.toHaveBeenCalled();
    expect(mockSessionService.createSession).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && pnpm test -- auth.service`
Expected: FAIL — `handleCallback` takes two arguments and does not know about merging.

- [ ] **Step 3: Implement the three branches**

In `backend/src/auth/services/auth.service.ts`, inject `AccountMergeService` and give `handleCallback` a third parameter. After the profile is fetched, resolve which row survives:

```ts
  async handleCallback(
    code: string,
    state: string,
    currentSessionId?: string,
  ): Promise<string> {
    // ... existing PKCE exchange and profile fetch, unchanged ...

    const currentUserId = await this.resolveCurrentUserId(currentSessionId);
    const existing = await this.userRepository.findBySpotifyUserId(profile.id);

    let user: UserEntity;
    if (existing && currentUserId && currentUserId !== existing.id) {
      await this.accountMergeService.merge(currentUserId, existing.id);
      user = existing;
    } else if (existing) {
      user = existing;
    } else if (currentUserId) {
      user = await this.userRepository.attachSpotify(currentUserId, {
        spotifyUserId: profile.id,
        avatarUrl: profile.images?.[0]?.url,
        country: profile.country,
      });
    } else {
      user = await this.userRepository.upsert({
        spotifyUserId: profile.id,
        displayName: profile.display_name ?? generateHandle(),
        avatarUrl: profile.images?.[0]?.url,
        country: profile.country,
      });
    }

    // ... existing token storage, then: ...
    return this.sessionService.createSession({
      userId: user.id,
      displayName: user.displayName,
      isTrusted: user.isTrusted,
      spotifyUserId: profile.id,
    });
  }

  /** A stale cookie is not an error here: it just means there is nothing to merge. */
  private async resolveCurrentUserId(
    sessionId?: string,
  ): Promise<string | undefined> {
    if (!sessionId) {
      return undefined;
    }
    try {
      const session = await this.sessionService.getSession(sessionId);
      return session.userId;
    } catch {
      return undefined;
    }
  }
```

In `backend/src/auth/controllers/auth.controller.ts`, read the existing session cookie in the callback handler and pass it through as the third argument.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pnpm test -- auth.service`
Expected: PASS, 4 tests.

- [ ] **Step 5: Verify the whole thing**

Run: `cd backend && pnpm exec tsc --noEmit && pnpm test && pnpm lint`
Expected: all PASS.

Then exercise it by hand against a local database, because the merge is the piece where a passing unit test is not sufficient evidence:
1. Play a round with no cookie. Confirm exactly one `users` row appears, with `spotify_user_id` null and a generated `display_name`.
2. Load the landing page in a fresh private window without playing. Confirm no new row.
3. Sign in with Spotify from that guest session, where the Spotify account has no row. Confirm the same row now carries the Spotify id — no second row.
4. Repeat from a new guest session into a Spotify account that already has a row. Confirm the totals summed, the higher streak survived, the guest row is gone, and `is_trusted` and `streak_freezes` on the survivor are unchanged.

- [ ] **Step 6: Commit**

```bash
git add backend/src/auth/services/auth.service.ts backend/src/auth/services/auth.service.spec.ts backend/src/auth/controllers/auth.controller.ts
git commit -m "feat(auth): keep a guest's progress when they sign in"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
|---|---|
| Schema — nullable `spotifyUserId` | 1 |
| Re-keying the session | 3, 4 |
| Session creation / lazy rows | 5 |
| End of the guest module | 6 |
| Naming | 2, 5 |
| Attaching credentials (backend half) | 5, 8 |
| Collision / merge table | 7, 8 |
| Privileges that do not follow | 5 (defaults), 7 (merge assertions) |
| Migration | 1 |
| Testing | each task's test steps; Task 8 Step 5 for manual |

Not covered here, deliberately: the spec's conversion-prompt placement (frontend, CAR-188/184) and the open question about reaping unclaimed rows.

**Deviation from the spec worth flagging:** the spec says `SessionGuard` itself stops rejecting anonymous requests. This plan splits that into three guards instead (Task 5), because making `SessionGuard` permissive everywhere would silently open the Spotify-backed routes it currently protects. Same outcome, one more file.
