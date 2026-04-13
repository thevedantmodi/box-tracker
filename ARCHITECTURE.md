# ARCHITECTURE.md

Deep architectural context for BoxTrack. Read this alongside CLAUDE.md. If you're making a non-trivial decision about data flow, sync behavior, or adding a new screen, read the relevant section here first.

---

## Why This Stack Exists

BoxTrack has one hard constraint that drives every other decision: **it must work without an internet connection**. Storage units, basements, and moving trucks don't have reliable signal. If the app fails to load or scan a box because it can't reach a server, it's useless at exactly the moment it's needed.

Everything else — the tech choices, the data model, the sync strategy — flows from that constraint.

---

## Tech Decisions & Rationale

### Expo (React Native) over a pure web app

The prototype was a plain HTML file. It works, but `getUserMedia` camera access on iOS Safari is inconsistent and slow to initialize, and there's no path to a proper home screen install with reliable offline support via PWA on iOS. Expo gives us:

- Native `expo-barcode-scanner` — fast, reliable, works completely offline
- Proper iOS offline support via the native app container
- EAS Build for distribution without needing App Store review for personal use (ad-hoc/TestFlight)

The tradeoff is build complexity. EAS builds are slower than deploying a web app. For a personal tool this is acceptable — we're not shipping daily.

### Vite + React web app

Kept alongside the mobile app because sometimes you want to look up a box from a laptop or a device that doesn't have the iOS app installed. It shares the `packages/core` data layer so it's not a maintenance burden — the web app is mostly just UI on top of shared logic.

The web app does **not** have the same offline guarantees as the mobile app. It uses the PowerSync web SDK which supports offline via IndexedDB, but this is best-effort. The mobile app is the primary client.

### PowerSync for offline-first sync

The alternatives considered:

| Option | Why rejected |
|---|---|
| Supabase Realtime only | No offline support — app is useless without signal |
| iCloud + expo-sqlite | iOS only, no web app, no Android path later |
| Custom sync with local SQLite | Too much to build and maintain for a personal tool |
| Realm / Atlas Device Sync | MongoDB-specific, more opinionated, larger SDK footprint |

PowerSync gives us local SQLite on device that syncs to Postgres (Supabase) when online. It handles conflict resolution, sync state, and the replication protocol. We don't build any of that.

The one limitation: PowerSync's sync is read-optimized — it syncs data *down* from Postgres quickly, and writes go through an upload queue. This means there's a brief window after a write where the data exists locally but hasn't confirmed to the server. This is fine for our use case (see Conflict Resolution below).

### Supabase for the backend

Postgres is the right database for this — structured data, a simple schema, no reason to reach for anything else. Supabase wraps it with:

- Auth (magic link + Apple Sign-In) without building it ourselves
- Row Level Security so the database itself enforces that you can only access your own boxes — not just the application layer
- A managed Postgres instance we don't have to operate
- PowerSync has first-class Supabase integration

### No ORM (Drizzle, Prisma, etc.)

We deliberately have no ORM. The reasons:

- PowerSync owns the local query layer — it exposes a SQLite interface and we query it directly through the PowerSync SDK. No ORM supports this.
- The Supabase side has one table. There is no query complexity that warrants an ORM.
- Drizzle would only earn its keep on migrations, which Supabase CLI handles natively via `supabase db diff` and `supabase migration apply`.
- Fewer dependencies means fewer things that break.

Schema changes are managed with the Supabase CLI. See the Database Workflow section in CLAUDE.md.

### Zustand for state

No server state library (React Query, SWR) because PowerSync *is* the server state layer — it keeps local SQLite in sync with Postgres and exposes reactive queries. We just need UI state on top of that. Zustand is minimal, works identically in React and React Native, and has no magic.

---

## Data Flow

### Read path (viewing a box)

```
Screen mounts
  → Zustand selector subscribes to PowerSync query
    → PowerSync executes SQLite query against local DB
      → Returns results synchronously (no network needed)
        → UI renders
```

PowerSync queries are reactive — if the local DB changes (e.g., sync completes in the background), the query result updates and the UI re-renders automatically.

### Write path (saving a box)

```
User saves form
  → Zustand action called
    → Validate input with Zod
      → PowerSync write to local SQLite (instant, synchronous)
        → UI updates immediately
          → PowerSync upload queue picks up the write
            → Replicates to Supabase Postgres in background
```

The UI never waits for the network. The write is considered complete as soon as it hits local SQLite. If the device is offline, the upload queue persists the write and retries when connectivity returns.

### QR scan flow

```
User taps Scan
  → Camera opens (expo-barcode-scanner on mobile, jsQR on web)
    → QR code detected → raw string extracted
      → Query local SQLite: SELECT * FROM boxes WHERE qr_code = ?
        → Box found: navigate to Box Detail screen
        → Box not found: navigate to Add Box form, qr_code field pre-filled
```

The QR code stored in the database is whatever string is encoded in the physical sticker. We don't generate or validate the format — any string is valid. This means you can use pre-printed QR stickers, generated UUID stickers, or even scan barcodes on boxes.

---

## Sync & Offline Behavior

### What works offline

Everything. The app is fully functional without a network connection:

- Scanning QR codes
- Viewing box contents
- Creating new boxes
- Editing box name, items, notes
- Deleting boxes
- Search

Writes made offline are queued and sync automatically when connectivity returns. The user does not need to manually trigger a sync.

### What doesn't work offline

- First-time login (auth requires network for magic link / Apple Sign-In)
- First sync after install (initial data pull requires network)

Once logged in and synced at least once, the app is fully offline capable indefinitely.

### Sync state in the UI

PowerSync exposes sync status. The app should surface this minimally:

- No indicator when online and synced (default state, no noise)
- Subtle offline badge when the device has no connectivity
- No "syncing" spinner — writes are local-first and the background sync is not the user's concern

Do not block the UI on sync state. Never show a loading spinner waiting for a network response.

### Conflict resolution

This is a personal app for a single user. True conflicts (the same box edited on two devices simultaneously) are extremely unlikely. PowerSync uses **last-write-wins** by default, keyed on `updated_at`.

This means: if you edit Box 12 on your phone while offline, then edit Box 12 on the web app before the phone syncs, whichever write has the later `updated_at` wins when sync occurs. One set of edits will be silently overwritten.

This is an acceptable tradeoff. The alternative — a merge UI or conflict queue — is significant complexity for an edge case that may never happen in practice. If it becomes a problem, PowerSync supports custom conflict handlers.

The `updated_at` column must always be set to `NOW()` on every write. This is enforced by a Postgres trigger on the `boxes` table, not by application code — don't rely on the client to set it correctly.

---

## Screen Logic & Edge Cases

### Home screen

Displays all boxes, sorted by `updated_at DESC` (most recently touched first). Search filters across `name`, `items` (array contains), and `notes` with a simple `LIKE` query on the concatenated fields — no full-text search needed at this scale.

**Edge case:** First launch after install, before any sync has completed. The local DB is empty. Show an empty state with a "Syncing…" message rather than "No boxes yet" — these are different states and the user should know the difference.

### Scanner screen

The scanner should be always-on while the screen is mounted — don't require a tap to activate. Auto-detect and navigate on first successful decode.

**Edge case:** QR code not in database. Navigate to Add Box with the QR code pre-filled and non-editable. The user should understand they're creating a new entry for this physical sticker, not that the scan failed.

**Edge case:** Camera permission denied. Show a clear explanation and a button that deep-links to iOS Settings. Don't just show a blank screen.

**Edge case:** Same QR code scanned twice in quick succession (debounce). After a successful scan and navigation, disable the scanner for 2 seconds to prevent double-navigation.

### Box Detail screen

Read-only view. Edit navigates to the Edit screen rather than inline editing — keeps the detail view clean and prevents accidental edits when scrolling.

**Edge case:** Box was deleted on another device and sync completed while the user is viewing it. The PowerSync reactive query will update and the box will disappear from the local DB. Handle this gracefully — navigate back to Home with a toast rather than crashing on a null reference.

### Add / Edit Box screen

The `qr_code` field behavior:
- If arriving from a QR scan: pre-filled, non-editable (locked to the physical sticker)
- If arriving from manual "Add Box": empty, editable (user can type any identifier)
- If editing an existing box: `qr_code` is always non-editable — changing it would break the physical sticker association

Items field: accept comma-separated input, split and trim on save, store as `text[]` in Postgres. Display as individual tags in the Detail view.

**Edge case:** User tries to save a box with a `qr_code` that already exists (duplicate sticker scan, or manual entry collision). Supabase has a unique constraint on `qr_code`. PowerSync will surface this as a sync error. Detect the conflict in the upload queue error handler and show a clear message: "This QR code is already assigned to [box name]."

---

## Row Level Security

Supabase RLS is the security boundary. The application layer should never be the only thing preventing a user from accessing another user's data.

The `boxes` table has RLS enabled with the following policies:

```sql
-- Users can only see their own boxes
CREATE POLICY "boxes_select" ON boxes
  FOR SELECT USING (user_id = auth.uid());

-- Users can only insert boxes for themselves
CREATE POLICY "boxes_insert" ON boxes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own boxes
CREATE POLICY "boxes_update" ON boxes
  FOR UPDATE USING (user_id = auth.uid());

-- Users can only delete their own boxes
CREATE POLICY "boxes_delete" ON boxes
  FOR DELETE USING (user_id = auth.uid());
```

PowerSync respects these policies when syncing — it will only replicate rows the authenticated user has SELECT access to. This means even if PowerSync's sync configuration were misconfigured, the database would still not return another user's data.

Never disable RLS on the `boxes` table. Never add a service role key to the client apps.

---

## packages/core Boundary

The `packages/core` package is the only place that should know about PowerSync, Supabase, or SQLite. Both apps (`apps/mobile` and `apps/web`) are consumers of core — they call functions and subscribe to stores, they do not import PowerSync or Supabase SDKs directly.

This means:
- Adding Android support later = add `apps/android`, consume `packages/core`, done
- Swapping PowerSync for a different sync backend = change `packages/core` only, neither app changes
- All sync edge case handling lives in one place

If you find yourself importing `@powersync/react-native` in `apps/mobile/src`, that's a sign something belongs in core instead.
