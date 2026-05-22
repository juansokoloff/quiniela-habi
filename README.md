# Quiniela Habi

A self-hosted World Cup 2026 prediction pool ("quiniela") built for the employees of a single company. Players predict match scores, earn points based on accuracy, and compete on a live leaderboard against the rest of the company — and against the Polymarket consensus.

Built with Next.js (App Router), Supabase (Postgres + Auth + Realtime + Storage), the Anthropic API for payment-receipt validation, and Polymarket's public Gamma API for market odds.

## Features

- Score-prediction grid for all 104 matches of the 2026 World Cup
- Scoring engine: 5 pts for picking the winner, 2 pts each for exact home/away goal counts, 1 pt for goal difference (multiplied 2x in knockout rounds)
- Real-time live scores via Supabase Realtime + a 1-minute cron that only fires inside match windows
- Crowd-vs-market calibration: how the company's average prediction stacks up against Polymarket's implied probabilities
- AI-powered payment-receipt validation (Anthropic) so admins don't manually verify hundreds of bank screenshots
- PWA installable on mobile, with dark mode
- Rate limiting (Upstash) and error tracking (Sentry), both no-op when their env vars aren't set
- Per-match analytics dashboard for admins

## Stack

- Next.js 16 (App Router, Server Components, Server Actions)
- Supabase (Postgres, Auth, Realtime, Storage)
- Tailwind v4 + Framer Motion
- Vitest for unit tests
- Anthropic SDK (Claude)
- Polymarket Gamma API (public)
- football-data.org API (free tier)

## Local development

```bash
git clone <this-repo>
cd quiniela-habi
npm install
cp .env.example .env.local
# Edit .env.local with your real values
npm run dev
```

Open http://localhost:3000.

## Database setup

Run the migrations in `supabase/migrations/` in order against your Supabase project's SQL editor. After your admin user signs up, manually promote them:

```sql
UPDATE profiles SET role = 'admin' WHERE email = '<your-admin-email>';
```

## Environment variables

See `.env.example` for the full list. Required minimum: Supabase URL + keys, Anthropic API key, football-data.org API key, a `CRON_SECRET`, and the payment-validation values (beneficiary name, Nequi number, CLABE).

## Cron jobs

- Daily full sync of fixtures from football-data.org — schedule via Vercel Cron or any external cron pointed at `/api/matches/sync`
- 1-minute live sync during match windows — `/api/matches/live-sync` (auto-skips when no match is within ±10 min / +3h)
- Daily Polymarket odds refresh — `/api/polymarket/sync`

All three endpoints require `Authorization: Bearer ${CRON_SECRET}`.

## Tests

```bash
npm test
```

## License

MIT
