# One identity for everyone

**Status:** approved, not yet implemented
**Tickets:** CAR-189 (this doc), CAR-188 (credentials), CAR-183 (daily guest round)

## Problem

Playing a round requires a Spotify OAuth login. Spotify Development Mode caps
that at five users, so today the app has a hard ceiling of five players.

The workaround already in the tree — `src/guest/` — is a second, parallel
identity system: a uuid in Redis with a 30-day TTL, no database row, no stats,
no streak, no history. It exists for exactly one reason: `User.spotifyUserId` is
`NOT NULL`, so a player without Spotify cannot be a `User`.

That reason is not worth a second identity system. Every feature worth having —
streaks, history, leaderboards, multiplayer rooms — hangs off `User`, and the
guest module has to either reimplement each one or go without.

## Goal

A player taps the app and plays. No login, no email, no password, no
interstitial. Identity is created for them; credentials are something they
attach later, if and when they want to.

Signing up stops being a gate at the door and becomes an upgrade to a row that
already exists and already has their progress on it.

## Design

### The inversion

Today: the Spotify identity is the user, and the `User` row is a projection of
it. After: the `User` row is the identity, and Spotify is a credential attached
to it.

```
  before                          after

  Spotify account                 User row  (id, displayName)
        |                            |
        v                       +----+----+
     User row                   |         |
        |                    Spotify   email/password
        v                   (optional)  (optional)
   stats, streak,                  |
   history, rooms             stats, streak, history, rooms
```

A row with no credentials at all is a guest. A row with one or both is a
registered user. Nothing else in the model needs to know the difference.

### Schema

`User.spotifyUserId` becomes nullable. Postgres allows many `NULL`s under a
unique index, so the existing `@unique` still holds for real Spotify ids and
imposes nothing on guests.

```prisma
model User {
  id            String  @id @default(uuid())
  spotifyUserId String? @unique @map("spotify_user_id")
  displayName   String  @map("display_name")
  ...
}
```

`displayName` stays required and is generated on creation (see *Naming*).

Everything else in the model is untouched: `Stats`, `GameSession`,
`UserPreference`, `RoomPlayer`, `StreakFreezeUsage` and `GauntletRun` all key on
`User.id` already, so a guest gets all of them for free the moment it has a row.

### Re-keying the session

This is the bulk of the work, and the part that is easy to underestimate.
`spotifyUserId` currently appears 97 times across 21 files, and the session
itself is built around it:

- `UserSessionDto` carries `spotifyUserId` as a required field.
- `SessionService.createSession` takes it as its first argument and writes a
  reverse mapping `user-session:{spotifyUserId} -> sessionId`.
- `SessionGuard` reads it off the session to refresh that mapping.
- `TrackPoolService` uses the reverse mapping to pool tracks across a room.

The change: **the session is keyed on `User.id`.**

```ts
class UserSessionDto {
  sessionId: string;
  userId: string;          // new, and now the identity
  spotifyUserId?: string;  // now optional, retained for Spotify API calls
  displayName: string;
  isTrusted: boolean;
  createdAt: number;
}
```

The reverse mapping becomes `user-session:{userId} -> sessionId`. Call sites
that use `spotifyUserId` purely to identify *who is asking* switch to `userId`;
the ones that use it to talk to the Spotify API keep it, and those are exactly
the endpoints that require a Spotify credential anyway.

### Session creation, and the end of the guest module

`SessionGuard` stops rejecting anonymous requests. On a request with no session
cookie it provisions one: create a `User` row, create a session keyed on it, set
the cookie. This is what `GuestSessionGuard` does today, minus the separate
identity space.

**Rows are created lazily — on first game start, not first page load.** A
crawler hitting the landing page must not create a `User`. Until a round begins
the visitor has no row and no cookie.

With that in place, most of `src/guest/` deletes: `guest-session.service.ts`,
`guest-session.guard.ts`, `guestId.decorator.ts`, `guest-game.service.ts`,
`guest-game.controller.ts`, and the guest round Redis keys. The game service
already handles all of it for a `User`.

`GUEST_PLAYLIST_IDS` and the pool-track selection stay, but move out of the
guest module — they are how *any* player without a Spotify library gets
something to play, which after this change includes email/password users. That
work is CAR-187.

### Naming

A new row gets a generated `displayName` immediately, so it is never blank in a
room or on a leaderboard. Two-word generated handles, in the app's own register
of music words, not `Guest_8f21`.

The first conversion ask is for a real name and nothing else: one field, no
password, no email. It appears where being seen matters — joining a multiplayer
room, or attaching a name to a shared result. This is the ask that gets a yes,
and a named player is worth more to the product than an anonymous one.

### Attaching credentials

Credentials attach to the row that is already there. There is no signup flow
that creates a user, and therefore no data migration at signup: the streak,
history and stats are already on the row being claimed.

That makes the pitch concrete — "keep your 6-day streak", with a real number —
rather than the generic "save your progress" that users have learned to ignore.

The ask appears in three places, and nowhere else:

1. **Contextual, for a name** — inline in the multiplayer join form and the
   share sheet. Not a modal.
2. **Contextual, for credentials** — on the post-round screen, once the streak
   is at least 3. Once, dismissible, not on every round.
3. **Permanent** — a quiet entry point in the profile area, so someone who goes
   looking for it always finds it.

No blocking interstitials, and no banner that reappears after dismissal.

### Collision: guest meets an existing account

A player builds six days of streak as a guest, then signs in with Spotify to an
account that already has a `User` row. Two rows, two streaks.

**The two rows merge.** Discarding the guest is simpler and is what most apps
do, but it destroys precisely the thing the conversion prompt just promised to
protect, at the moment the user is trusting it. That is the wrong trade here.

The merge runs in one transaction, guest row into existing row:

| Data | Rule |
|---|---|
| `Stats.totalGames`, `totalWins` | sum, per mode |
| `Stats.roundDistribution` | element-wise sum |
| `Stats.currentStreak` | take the higher |
| `Stats.bestStreak` | take the higher |
| `Stats.lastWinDate` | take the later |
| `GameSession` | reassign `userId` to the surviving row |
| `GauntletRun` | reassign `userId` |
| `RoomPlayer` | reassign, skipping any row that would violate `@@unique([roomId, userId])` |
| `UserPreference` | keep the existing account's; drop the guest's |
| `answeredQuestionIds` | union |
| `streakFreezes` | keep the existing account's — see below |
| `isTrusted`, `isAdmin` | keep the existing account's, never the guest's |

The guest row is deleted at the end of the transaction.

If the Spotify account has **no** existing row there is no collision: the guest
row simply gets `spotifyUserId` set. This is the common path.

### Privileges that do not follow

`isTrusted` defaults to `false`, and every new row is anonymous, so:

- **Streak freezes stay closed.** `TrustedUserGuard` already sits on all three
  freeze endpoints in `streak.controller.ts`; anonymous rows bounce off it
  without the streak module needing to know guests exist. The merge rules above
  never let a guest row raise `isTrusted` or `streakFreezes`.
- **Library-backed play stays closed.** Playing your own playlists and liked
  songs requires a Spotify credential by definition. That is the one thing
  Spotify buys, and after this change it is the *only* thing it buys.

### Migration

`spotifyUserId` goes from `NOT NULL` to nullable. That widens a constraint, so
existing rows stay valid unchanged and the migration is not destructive.

Back up production before running it regardless — it is the users table.

## Testing

- **Merge** is the highest-risk piece and gets the most coverage: each rule in
  the table above, plus the `RoomPlayer` unique-violation path, plus the
  assertion that `isTrusted` and `streakFreezes` never transfer.
- **Lazy creation**: a request to the landing page creates no row; a request
  that starts a round creates exactly one.
- **Re-keying**: a session for a user with `spotifyUserId = null` survives
  `SessionGuard` and reaches an endpoint that does not need Spotify; the same
  session is refused by a Spotify-backed endpoint.
- **Privilege**: an anonymous row is refused by every `TrustedUserGuard` route.

## Sequencing

CAR-189 lands before CAR-183. Building the daily streak on the guest module
first would mean migrating streak state — the data users would most resent
losing — a week later.

CAR-188 (email/password) becomes small once this is in: it attaches credentials
to an existing row rather than creating a user.

## Open

- Whether an unclaimed row with no activity should be reaped after some period,
  and what that period is. Not a launch blocker; the rows are tiny.
