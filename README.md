# Tournify 🏟️

A **Cricbuzz-style** college sports tournament tracking web application with a polished public viewer and a robust admin dashboard.

## Features

### Public Viewer
- 🔴 **Live Scores** — Real-time match updates with animated pulse indicators
- 📅 **Upcoming Matches** — Relative time display ("Starts in 2 hours")
- ✅ **Past Results** — Full match history with timelines
- 🏆 **Multi-Sport** — Navigate between sports via tabs
- 🌙 **Dark/Light Mode** — Toggle between themes
- 📱 **Responsive** — Works on mobile, tablet, and desktop

### Admin Dashboard
- 📊 **Dashboard** — Overview stats and quick actions
- 🏆 **Events** — Create and manage tournament events
- 👥 **Teams** — Add teams, manage players, opt-out of sports
- ⚽ **Sports** — Configure tournament formats (Knockout, Round Robin, Double RR, Hybrid)
- 📋 **Squads** — Register team rosters per sport
- 🗓️ **Tournaments** — Generate brackets, manage groups (random/manual), set schedules
- 🔴 **Live Desk** — Real-time score updates, push match events, change status

### Tournament Formats
- **Knockout** — Single elimination bracket
- **Round Robin** — Every team plays every other team
- **Double Round Robin** — Two legs (home/away)
- **Hybrid** — Group stage (Round Robin) → Knockout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (Credentials) |
| Styling | Vanilla CSS + CSS Modules |
| Date Utils | date-fns |
| Deployment | Vercel |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier) or local MongoDB

### Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI and NextAuth secret

# Run development server
npm run dev

# Seed admin user
curl -X POST http://localhost:3000/api/seed
```

### Default Admin Credentials
- **Email:** admin@tournify.com
- **Password:** admin123

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full Vercel + MongoDB Atlas deployment instructions.

## Architecture

```
tournify/
├── app/
│   ├── (viewer)/          # Public-facing pages
│   │   ├── page.js        # Home page
│   │   ├── sport/[id]/    # Sport dashboard
│   │   └── match/[id]/    # Match detail
│   ├── admin/             # Admin dashboard
│   │   ├── events/        # Event management
│   │   ├── teams/         # Team management
│   │   ├── sports/        # Sport configuration
│   │   ├── squads/        # Squad registration
│   │   ├── tournaments/   # Bracket generation
│   │   └── live/          # Live score desk
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth
│   │   ├── public/        # Public data endpoints
│   │   └── seed/          # Admin seeding
│   └── actions/           # Server actions
├── models/                # Mongoose schemas
├── lib/                   # Utilities (DB connection)
└── public/                # Static assets
```

## License

MIT
