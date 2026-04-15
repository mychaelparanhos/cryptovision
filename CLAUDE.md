# CryptoVision — Claude Code Instructions

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Stack
- **Frontend:** Next.js 14+ (App Router), Tailwind CSS, shadcn/ui
- **ORM:** Drizzle (schema in packages/shared/src/db/schema.ts)
- **Database:** Supabase Postgres
- **Auth:** Supabase Auth (email + Google OAuth)
- **Realtime:** SSE via Redis PUB/SUB (NOT Supabase Realtime Broadcast)
- **Cache:** Upstash Redis
- **Payments:** Stripe (primary) + NOWPayments (crypto)
- **Charts:** TradingView Lightweight Charts + Recharts
- **Deploy:** Vercel (web), Railway (ingestion + alerts workers)

## Conventions
- All UI text in English
- Dark mode only (no light mode toggle)
- Numbers use JetBrains Mono with tabular-nums
- Financial values use numeric/decimal (never float)
- Imports from shared: `import { ... } from '@cryptovision/shared'`

## Commands
- `pnpm dev` — start all apps
- `pnpm build` — build all packages
- `pnpm typecheck` — TypeScript check
- `pnpm lint` — lint all packages
