# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

BoxTrack is an offline-first storage box inventory app for personal use, targeting iOS and mobile web. It lets you scan QR codes on physical storage boxes to look up and manage their contents. Built for a single user syncing across multiple devices.

It's a two-app monorepo with a shared core package — the mobile app and web app share data access logic and types.

- `apps/mobile/` — Expo (React Native) iOS app, active development
- `apps/web/` — Vite + React PWA for mobile browser
- `packages/core/` — Shared types, database access, and sync logic

---

## Commands

All commands are run from within each app's directory (e.g., `cd apps/mobile`).

### apps/mobile

```bash
pnpm install          # Install dependencies
pnpm run start        # Start Expo dev server
pnpm run ios          # Run on iOS simulator
pnpm run lint         # ESLint check
pnpm run type-check   # TypeScript check
pnpm run test         # Vitest unit tests
pnpm run build        # EAS production build
```

### apps/web

```bash
pnpm install
pnpm run dev          # Vite dev server
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run lint
pnpm run type-check
pnpm run test
```

### packages/core

```bash
pnpm run build        # Compile shared package
pnpm run type-check
pnpm run test
```

### Database (Supabase)

```bash
# Run from packages/core
pnpm run db:generate  # Generate migration files from schema changes
pnpm run db:migrate   # Apply migrations
pnpm run db:studio    # Open Supabase Studio
```

---

## Architecture

### Request / Data Flow

```
UI → Zustand store → core/db (PowerSync) → local SQLite → [sync] → Supabase (Postgres)
```

PowerSync handles offline-first sync. All reads/writes go through local SQLite; PowerSync replicates to Supabase when online.

### Key Directory Structure

```
packages/core/src/
├── db/
│   ├── schema.ts       # Single source of truth for DB schema
│   └── client.ts       # PowerSync + Supabase client setup
├── store/              # Zustand stores (shared state logic)
├── types/              # Shared TypeScript types
└── validation/         # Zod schemas

apps/mobile/src/
├── components/         # React Native UI components
├── screens/            # Screen components (Home, Scanner, Detail, Edit)
└── navigation/         # Expo Router file-based routes

apps/web/src/
├── components/         # React web UI components
└── pages/              # Vite routes
```

### Infrastructure

- **Mobile runtime**: Expo (React Native) — iOS via EAS Build
- **Web runtime**: Vite + React — deployed to Cloudflare Pages
- **Database**: PostgreSQL via Supabase (cloud), SQLite via PowerSync (local/offline)
- **Sync**: PowerSync — offline-first, last-write-wins for solo use
- **Auth**: Supabase Auth (magic link + Apple Sign-In)
- **State**: Zustand — shared logic in `packages/core`, consumed by both apps
- **QR scanning (mobile)**: `expo-barcode-scanner`
- **QR scanning (web)**: `jsQR` + `getUserMedia`

### Formatting & Style

Prettier + ESLint, tabs, single quotes, no trailing commas, 100-char width. Run `pnpm run lint` before committing.

---

## Critical Rules

1. **Never trust client-supplied user IDs** — always derive identity from the Supabase Auth session server-side
2. **All user input must pass Zod validation** before touching the database
3. **`schema.ts` is the immutable source of truth** — all DB changes go through `db:generate` → `db:migrate`, never raw Supabase console edits
4. **All DB access goes through PowerSync** — no direct Supabase Postgres queries from app code; use the PowerSync client in `packages/core`
5. **No client-side auth bypasses** — Supabase Row Level Security (RLS) policies enforce that users can only read/write their own boxes
6. **No new dependencies without consideration** — the stack is intentionally lean; discuss before adding packages
7. **Shared logic belongs in `packages/core`** — if both apps need it, it goes in core, not duplicated

---

## Database Workflow

```bash
# 1. Edit packages/core/src/db/schema.ts
# 2. Generate migration
pnpm run db:generate
# 3. Apply locally
pnpm run db:migrate
# 4. Commit both schema.ts and the generated migration file
```

### Schema

```sql
boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  qr_code     text unique not null,
  name        text not null,
  items       text[],
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
)
```

RLS policy: users can only select/insert/update/delete rows where `user_id = auth.uid()`.

---

## Testing Requirements

New features require unit tests for core logic and at least one integration test for the sync/db layer. Run the full check before committing:

```bash
pnpm run type-check && pnpm run lint && pnpm run test && pnpm run build
```
