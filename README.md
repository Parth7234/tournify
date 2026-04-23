# Tournify 

A **Cricbuzz-style** college sports tournament tracking web application with a polished public viewer and a robust admin dashboard. Built for managing multi-sport events with real-time score updates, automatic bracket advancement, medal allocation, and a master leaderboard.

## Features

### Public Viewer
- **Live Scores** — Real-time match updates via HTTP short-polling (5–10s intervals)
- **Upcoming Matches** — Relative time display ("Starts in 2 hours")
- **Past Results** — Full match history with winner display and match timelines
- **Master Leaderboard** — Aggregated medal tally across all sports, ranked by Gold → Silver → Bronze
- **Sport Dashboard** — Per-sport view with points tables (round robin) or knockout brackets
- **Live Standings** — Auto-computed points table from match results (Win=3, Draw=1)
- **Responsive** — Fully responsive across mobile, tablet, and desktop

### Admin Dashboard
- **Dashboard** — Overview stats (events, teams, sports, live/upcoming/completed match counts)
- **Events** — Create and manage tournament events with status lifecycle (Draft → Active → Completed → Ended)
- **Teams** — Add teams, manage player rosters, configure sport opt-outs
- **Sports** — Configure sports with tournament formats; restricted to Basketball, Volleyball, Chess, Table Tennis, Badminton, Football
- **Squads** — Register team rosters per sport (unique constraint: one squad per team per sport)
- **Tournaments** — Generate brackets/schedules, manage groups (random/manual assignment), set match dates
- **Live Desk** — Real-time score updates, push match events (goals, fouls, cards), manage goal scorers, change match status

### Tournament Formats
| Format | Description |
|--------|-------------|
| **Knockout** | Single elimination bracket with automatic advancement to next round |
| **Round Robin** | Every team plays every other team once; standings computed automatically |
| **Double Round Robin** | Two legs (home/away) for each matchup |
| **Hybrid** | Group stage (Round Robin) → Knockout playoffs |

### Automated Systems
- **Knockout Auto-Advancement** — When all matches in a round complete, winners are automatically paired for the next round (Round 1 → Quarter Final → Semi Final → Final)
- **Medal Allocation** — When all matches in a sport finish:
  - *Knockout*: Final winner → 🥇, runner-up → 🥈, semi-final losers → 🥉
  - *Points-based*: 1st → 🥇, 2nd → 🥈, 3rd → 🥉 (based on standings)
- **Event Finalization** — Event status automatically set to "Ended" when all sports in the event are completed
- **Orphan Cleanup** — Medal recalculation endpoint to handle edge cases (deleted sports, etc.)

### Sport-Specific Live Features
| Sport | Live Features |
|-------|--------------|
| Basketball, Volleyball, Table Tennis, Badminton | Live score display |
| Football | Live score + goal scorer tracking (player name, team, minute) |
| Chess | Support for 0.5-point draws (tied matches) |

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router + Turbopack) | 16.2.4 |
| Frontend | React | 19.2.4 |
| Styling | Tailwind CSS v4 (JIT, `@theme` design tokens) | 4.2.4 |
| Database | MongoDB Atlas + Mongoose ODM | 9.5.0 |
| Authentication | NextAuth.js (Credentials + JWT) | 4.24.14 |
| Icons | Google Material Symbols (Outlined) | — |
| Deployment | Vercel (Serverless) | — |

## Architecture

```
tournify/
├── app/
│   ├── layout.js                   # Root layout (HTML, global CSS, fonts)
│   ├── globals.css                 # Tailwind v4 @theme design tokens
│   ├── providers.js                # NextAuth SessionProvider wrapper
│   ├── (viewer)/                   # Public-facing pages (route group)
│   │   ├── layout.js               # Viewer layout wrapper
│   │   ├── ViewerLayoutClient.js   # Header, nav, event selector, footer
│   │   ├── page.js                 # Home — live scores, upcoming, results
│   │   ├── leaderboard/page.js     # Master medal leaderboard
│   │   ├── sport/[sportId]/page.js # Sport dashboard (bracket/standings)
│   │   └── match/[matchId]/page.js # Match detail (scores, timeline, scorers)
│   ├── admin/                      # Admin dashboard (auth-protected)
│   │   ├── layout.js               # Admin layout (Providers + sidebar)
│   │   ├── AdminLayoutClient.js    # Sidebar nav, hamburger menu
│   │   ├── page.js                 # Dashboard with stats cards
│   │   ├── login/page.js           # Login form
│   │   ├── events/page.js          # CRUD for events
│   │   ├── teams/page.js           # CRUD for teams + players
│   │   ├── sports/page.js          # CRUD for sports
│   │   ├── squads/page.js          # CRUD for squads
│   │   ├── tournaments/page.js     # Bracket generation + scheduling
│   │   └── live/page.js            # Live score desk
│   ├── actions/                    # Server Actions (server-side CRUD)
│   │   ├── eventActions.js         # Event CRUD
│   │   ├── teamActions.js          # Team + Player CRUD
│   │   ├── sportActions.js         # Sport CRUD
│   │   ├── squadActions.js         # Squad CRUD
│   │   └── matchActions.js         # Match CRUD + tournament generation
│   │                                 + knockout advancement + medal allocation
│   └── api/                        # API Routes (REST endpoints)
│       ├── auth/[...nextauth]/     # NextAuth handler (login/session)
│       ├── public/
│       │   ├── events/             # GET active events
│       │   ├── sports/             # GET sports (filterable by event)
│       │   ├── matches/            # GET matches (filter by sport/status/id)
│       │   ├── standings/          # GET computed points table for a sport
│       │   └── leaderboard/        # GET aggregated medal tally
│       ├── admin/stats/            # GET dashboard statistics
│       ├── seed/                   # POST seed admin user
│       ├── cleanup/                # POST wipe all data (preserves admin)
│       └── recalculate/            # POST recalculate medals for all sports
├── models/                         # Mongoose schemas (8 collections)
│   ├── User.js                     # Admin user (email, passwordHash, role)
│   ├── Event.js                    # Tournament event
│   ├── Team.js                     # Participating team
│   ├── Player.js                   # Individual player
│   ├── Sport.js                    # Sport config + tournament format
│   ├── Squad.js                    # Team roster for a sport
│   ├── Match.js                    # Match + embedded events/scorers
│   └── Medal.js                    # Medal records (gold/silver/bronze)
├── lib/
│   └── mongodb.js                  # Singleton DB connection (global cache)
└── public/                         # Static assets
```

## Data Model

```
User (standalone)
Event ──1:N──→ Team ──1:N──→ Player
Event ──1:N──→ Sport ──1:N──→ Squad (Team × Sport, unique pair)
                Sport ──1:N──→ Match (squadA, squadB, scores, events)
Event ──1:N──→ Medal (Sport × Team × medal type)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works) or local MongoDB

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd tournify

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with:
#   MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
#   NEXTAUTH_SECRET=<random-secret>
#   NEXTAUTH_URL=http://localhost:3000

# Run development server
npm run dev

# Seed admin user (run once)
curl -X POST http://localhost:3000/api/seed
```

### Utility Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/seed` | POST | Creates the default admin user |
| `/api/cleanup` | POST | Wipes all data except admin user |
| `/api/recalculate` | POST | Recalculates medals for all completed sports |

## How It Works

### Real-Time Updates
The viewer uses **HTTP short-polling** — pages re-fetch data at fixed intervals (5–10 seconds) via `setInterval` + `fetch`. This approach was chosen over WebSockets because:
- Zero additional dependencies (no Socket.io)
- Works on serverless platforms (Vercel)
- Acceptable latency for sports score updates

### Network Stack
All communication runs over **TCP** (HTTP/HTTPS). MongoDB connections use the MongoDB Wire Protocol over TLS-encrypted TCP.

### Why MongoDB?
- **Flexible schema** — Different sports store different data (goal scorers for football, 0.5 points for chess)
- **Embedded subdocuments** — Match events and goal scorers are embedded directly in the Match document, reducing JOINs
- **JavaScript-native** — Documents are JSON objects, matching the Next.js data flow natively
- **Free hosting** — MongoDB Atlas free tier (512MB) is sufficient for college tournaments

## License

MIT
