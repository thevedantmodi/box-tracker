# BoxTrack

Offline-first storage box inventory app. Scan QR codes on physical boxes to instantly look up and manage their contents — works without internet in basements, storage units, and moving trucks.

Two clients share one data layer: an iOS app (Expo) and a mobile web app (Vite + React). Both sync to the same Supabase backend via PowerSync.

---

## How it works

Stick a QR code on a box. Scan it. The app either opens that box's detail page or drops you into the "Add box" form with the QR code pre-filled. Add a name, list items (comma-separated), and optional notes. Done.

Everything works offline. Writes go to local SQLite immediately. PowerSync syncs to Supabase in the background when you're online.

---

## Stack

| Layer | Technology |
|---|---|
| iOS app | Expo (React Native), Expo Router |
| Web app | Vite + React, React Router |
| Shared logic | `packages/core` — shared types, queries, mutations |
| Local database | SQLite via PowerSync |
| Cloud database | PostgreSQL via Supabase |
| Sync | PowerSync (offline-first, last-write-wins) |
| Auth | Supabase Auth (email + password) |
| State | Zustand |
| Validation | Zod |
| QR scanning (mobile) | expo-camera |
| QR scanning (web) | jsQR + getUserMedia |

---

## Monorepo structure

```
box-tracker/
├── apps/
│   ├── mobile/          # Expo iOS app
│   └── web/             # Vite React PWA
├── packages/
│   └── core/            # Shared data layer (types, queries, mutations, schema)
├── supabase/
│   └── migrations/      # SQL migrations (committed, applied via Supabase CLI)
└── tasks/               # Original task specs (01–07)
```

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- [Supabase account](https://supabase.com) + project
- [PowerSync account](https://www.powersync.com) + instance

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Supabase

Create a project at [supabase.com](https://supabase.com). Apply the migration:

```bash
cd packages/core
pnpm run db:migrate
```

This creates the `boxes` table with Row Level Security policies.

In the Supabase dashboard:
- **Authentication → Sign In / Providers → Email** → disable "Confirm email" (for development)

### 3. Configure PowerSync

Create an instance at [powersync.com](https://www.powersync.com). In the dashboard:

- Connect it to your Supabase project
- Under **Client Auth**, enable **Development tokens** (for local testing) or configure Supabase JWT (for production)

You'll need the instance URL (e.g. `https://abc123.powersync.journeyapps.com`).

### 4. Environment variables

**Mobile** — copy and fill in `apps/mobile/.env.example`:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

**Web** — copy and fill in `apps/web/.env.example`:

```bash
cp apps/web/.env.example apps/web/.env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_POWERSYNC_URL=https://your-instance.powersync.journeyapps.com
```

Get these values from:
- **Supabase** → Project Settings → API → URL and `anon` key
- **PowerSync** → Instance dashboard → Settings → Instance URL

---

## Running locally

### iOS app

```bash
cd apps/mobile
pnpm run ios          # Run on iOS simulator
```

To run on a physical device without a paid Apple Developer account:

1. Open `apps/mobile/ios/BoxTrack.xcworkspace` in Xcode
2. Select the `BoxTrack` target → **Signing & Capabilities**
3. Add your Apple ID as a team (free account works)
4. Change the bundle ID to something unique (e.g. `com.yourname.boxtrack`)
5. Plug in your iPhone, select it as the run target, hit **Run**
6. On the device: **Settings → General → VPN & Device Management → trust your Apple ID**

> Free account limitation: the app expires after 7 days and must be re-built from Xcode. Max 3 sideloaded apps at once.

### Web app

```bash
cd apps/web
pnpm run dev          # http://localhost:5173
```

---

## Development commands

All commands run from within each package's directory.

### Mobile (`apps/mobile`)

```bash
pnpm run start        # Start Expo dev server (for Expo Go or dev build)
pnpm run ios          # Run on iOS simulator
pnpm run lint         # ESLint
pnpm run type-check   # TypeScript
pnpm run test         # Vitest
pnpm run build        # EAS production build
```

### Web (`apps/web`)

```bash
pnpm run dev          # Vite dev server
pnpm run build        # Production build
pnpm run preview      # Preview production build
pnpm run lint
pnpm run type-check
pnpm run test
```

### Core (`packages/core`)

```bash
pnpm run build        # Compile TypeScript
pnpm run type-check
pnpm run test
```

### Database (`packages/core`)

```bash
pnpm run db:generate  # Generate migration from schema changes
pnpm run db:migrate   # Apply migrations to Supabase
pnpm run db:studio    # Open Supabase Studio
```

### Full check (run before committing)

```bash
# From packages/core
pnpm run type-check && pnpm run test

# From apps/mobile
pnpm run type-check && pnpm run lint && pnpm run test

# From apps/web
pnpm run type-check && pnpm run lint && pnpm run build
```

---

## Database schema

```sql
boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  qr_code     text unique not null,
  name        text not null,
  items       text[],
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()   -- updated by trigger, not app code
)
```

RLS enforces that users can only access rows where `user_id = auth.uid()`.

To change the schema: edit `packages/core/src/db/schema.ts`, run `db:generate`, then `db:migrate`. Commit both files.

---

## Offline behavior

- **Fully offline**: scan, view, create, edit, delete, search
- **Requires network**: first login, first sync after install
- Once logged in and synced once, the app works indefinitely offline
- Offline writes queue automatically and sync when connectivity returns
- Conflict resolution: last-write-wins on `updated_at` (single-user app, conflicts are rare)

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed rationale on tech decisions, data flow diagrams, sync behavior, conflict resolution, and edge case handling per screen.

---

## Key design rules

1. **Never import `@powersync/react-native` outside `apps/mobile/lib/powersync.ts`** — platform-specific bootstrap is isolated to one file
2. **Never import `@powersync/web` outside `apps/web/src/lib/powersync.ts`** — same rule for web
3. **All DB access goes through `packages/core`** — no direct Supabase Postgres queries from app code
4. **Schema changes go through migrations** — never edit the Supabase schema via the console
5. **RLS is the security boundary** — app-layer checks are secondary; the DB enforces user isolation

---

## Deploying

### iOS (EAS Build)

```bash
cd apps/mobile
pnpm run build
```

Requires an [EAS account](https://expo.dev) and Apple Developer account for distribution beyond local sideloading. For personal use, sideloading via Xcode (see above) is sufficient.

### Web (Cloudflare Pages)

Build output is `apps/web/dist/`. Deploy to Cloudflare Pages, Vercel, Netlify, or any static host. Set the environment variables in your host's dashboard (same as `.env` values).

```bash
cd apps/web
pnpm run build        # outputs to dist/
```
