<p align="center">
  <img src="assets/logo.png" alt="Unpaused" width="120" />
</p>

<h1 align="center">Unpaused</h1>

<p align="center">
  A Spotify-powered music guessing game. Hear a snippet, name the track - how fast can you guess?
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Spotify%20API-1DB954?logo=spotify&logoColor=white" alt="Spotify" />
</p>

<!-- TODO: Add a hero GIF/screenshot of gameplay here -->
<!-- ![Gameplay Demo](assets/demo.gif) -->

---

## What is Unpaused?

Unpaused challenges you to identify songs from increasingly longer audio snippets. Starting at just **0.1 seconds**, each wrong guess or skip unlocks a longer clip - up to 8 seconds across 6 rounds. Play solo from your own Spotify playlists, compete in daily challenges, or go head-to-head in real-time multiplayer.

### Key Features

- **Playlist Mode** - Pick any of your Spotify playlists and guess tracks from it
- **Daily Challenge** - A daily round pulled from your own Liked Songs
- **Real-time Multiplayer** - Create a room, invite friends, race to guess first
- **Progressive Difficulty** - 6 rounds: 0.1s, 0.5s, 1s, 2s, 4s, 8s snippets
- **Streak System** - Maintain daily win streaks, earn freezes through trivia quizzes
- **Stats & History** - Track your performance, win rate, score distribution, and game history

---

## Screenshots

<!-- TODO: Replace these placeholders with actual screenshots -->

<table>
  <tr>
    <td align="center" width="50%">
      <!-- TODO: Screenshot of home page with playlists -->
      <strong>Home - Playlist Selection</strong><br/>
      <code>assets/screenshots/home.png</code>
    </td>
    <td align="center" width="50%">
      <!-- TODO: Screenshot of gameplay (mid-round) -->
      <strong>Gameplay - Guessing a Song</strong><br/>
      <code>assets/screenshots/gameplay.png</code>
    </td>
  </tr>
  <tr>
    <td align="center">
      <!-- TODO: Screenshot of song reveal card -->
      <strong>Song Reveal</strong><br/>
      <code>assets/screenshots/reveal.png</code>
    </td>
    <td align="center">
      <!-- TODO: Screenshot of multiplayer lobby or results -->
      <strong>Multiplayer Results</strong><br/>
      <code>assets/screenshots/multiplayer.png</code>
    </td>
  </tr>
  <tr>
    <td align="center">
      <!-- TODO: Screenshot of daily stats page -->
      <strong>Daily Stats & Streaks</strong><br/>
      <code>assets/screenshots/stats.png</code>
    </td>
    <td align="center">
      <!-- TODO: Screenshot of game history page -->
      <strong>Game History</strong><br/>
      <code>assets/screenshots/history.png</code>
    </td>
  </tr>
</table>

<!-- TODO: Optional - a short screen recording / GIF showing a full round -->
<!-- ### Demo
![Full Round Demo](assets/demo-round.gif) -->

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | NestJS 10, TypeScript, Prisma ORM, BullMQ |
| **Database** | PostgreSQL 16 |
| **Cache / Sessions** | Redis 7 |
| **Real-time** | Socket.io (WebSockets) |
| **Auth** | Spotify OAuth with PKCE |
| **API Contract** | OpenAPI / Swagger - auto-generated TypeScript SDK |
| **Infrastructure** | Docker Compose (dev), Vercel (frontend deployment), Railway (backend deployment) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  Next.js 16 · React 19 · TanStack Query · Framer Motion     │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────┐   │
│  │ Playlist │ │   Game   │ │   Daily    │ │ Multiplayer │   │
│  │ Browser  │ │  Engine  │ │ Challenge  │ │   Lobby     │   │
│  └──────────┘ └──────────┘ └────────────┘ └─────────────┘   │
│         ▲            ▲            ▲              ▲          │
└─────────┼────────────┼────────────┼──────────────┼──────────┘
          │  REST/API  │            │    WebSocket │
          ▼            ▼            ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                              │
│  NestJS · Prisma · BullMQ · Socket.io                       │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌──────────────┐   │
│  │ Auth │ │ Game │ │Playlist│ │ Streak │ │ Multiplayer  │   │
│  │      │ │      │ │        │ │ + Quiz │ │ + WebSocket  │   │
│  └──┬───┘ └──┬───┘ └───┬────┘ └───┬────┘ └──────┬───────┘   │
│     │        │         │          │             │           │
│     ▼        ▼         ▼          ▼             ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL  +  Redis                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Frontend** communicates with the backend via a type-safe SDK auto-generated from the OpenAPI spec. Multiplayer events flow through WebSocket connections for real-time synchronization.

---

## Game Modes

### Playlist Mode

Pick any playlist from your Spotify library. The game selects a random track and plays progressively longer snippets across 6 rounds.

| Round | Duration |
|-------|----------|
| 1 | 0.1s |
| 2 | 0.5s |
| 3 | 1s |
| 4 | 2s |
| 5 | 4s |
| 6 | 8s |

Guess correctly in fewer rounds for a better score. Wrong guesses reveal partial matches (correct artist, album, or both).

### Daily Challenge

One round per day, pulled from your Liked Songs on Spotify. Maintain daily win streaks, and earn streak freezes through trivia quizzes. Missing a day breaks your streak - unless you have a freeze.

### Multiplayer

Create a room, share the invite code, and compete in real-time. The host picks the number of rounds, and all players race to identify the same tracks. Scores are tallied across rounds with a final leaderboard.

<!-- TODO: GIF showing multiplayer lobby → gameplay → results flow -->
<!-- ![Multiplayer Flow](assets/multiplayer-flow.gif) -->

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** (`npm install -g pnpm`)
- **Docker** & Docker Compose
- A **Spotify Developer** account

### 1. Clone and install

```bash
git clone https://github.com/your-username/unpaused.git
cd unpaused
pnpm install
```

### 2. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Set up Spotify app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3001/auth/callback`
4. Copy the **Client ID** (no client secret needed - PKCE flow)

### 4. Configure environment

**Backend** (`backend/.env`):

```bash
cd backend && cp env.template .env
```

```env
DATABASE_URL="postgresql://unpaused:unpaused_dev@localhost:5432/unpaused?schema=public"
REDIS_URL="redis://localhost:6379"
SPOTIFY_CLIENT_ID="your_client_id"
SPOTIFY_REDIRECT_URI="http://localhost:3001/auth/callback"
SESSION_SECRET="generate-a-random-32-char-string"
FRONTEND_URL="http://localhost:3000"
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### 5. Initialize database

```bash
pnpm db:generate
pnpm db:migrate
```

### 6. Start development servers

```bash
pnpm dev
```

This starts both servers concurrently:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001

---

## Project Structure

```
unpaused/
├── backend/
│   ├── src/
│   │   ├── admin/           # Admin dashboard APIs
│   │   ├── auth/            # Spotify OAuth, sessions, cookies
│   │   ├── game/            # Game logic, rounds, guessing, stats
│   │   ├── multiplayer/     # Rooms, WebSocket gateway, scoring
│   │   ├── playlist/        # Playlist fetching, filtering
│   │   ├── spotify/         # Spotify SDK wrapper
│   │   ├── streak/          # Streaks, freezes, quiz system
│   │   ├── track/           # Track metadata caching
│   │   ├── prisma/          # Database service
│   │   └── redis/           # Cache service
│   └── prisma/
│       └── schema.prisma    # Data model
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components by feature
│   │   ├── game/            # Core gameplay UI
│   │   ├── multiplayer/     # Multiplayer-specific UI
│   │   ├── daily/           # Daily challenge components
│   │   ├── history/         # Game history views
│   │   ├── streak/          # Streak & freeze UI
│   │   ├── playlist/        # Playlist cards & grid
│   │   └── ui/              # Shared primitives (shadcn/ui)
│   ├── hooks/               # Custom React hooks by domain
│   ├── sdk/                 # Auto-generated API client
│   └── lib/                 # Utilities, query keys, styles
├── docker-compose.yml       # Local Postgres + Redis
└── swagger-spec.json        # Generated OpenAPI spec
```

---

## Development

### Useful commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start frontend + backend |
| `pnpm build` | Production build |
| `pnpm build:sdk` | Regenerate API SDK from Swagger spec |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:migrate` | Run database migrations |
| `pnpm test` | Run all tests |

### SDK regeneration

The frontend uses a TypeScript SDK auto-generated from the backend's OpenAPI spec. After changing any backend DTOs or controllers:

```bash
pnpm build:sdk
```

This regenerates `swagger-spec.json` and the frontend SDK in `frontend/sdk/`.

---

## Security

- Spotify tokens are stored **server-side only** - never exposed to the browser
- Sessions use **httpOnly cookies** backed by Redis
- **PKCE OAuth flow** - no client secret needed
- Rate limiting via `@nestjs/throttler`
- Optional site-level password gate for private deployments

---

## License

Private project.
