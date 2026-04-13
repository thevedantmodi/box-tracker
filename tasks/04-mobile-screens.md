# Task 04 — Mobile App: Navigation & Screens

Read CLAUDE.md and ARCHITECTURE.md before starting. The Screen Logic & Edge Cases section describes exact behavior for every screen — follow it precisely.

## Goal

Build all screens and navigation for the mobile app. Import everything from `@boxtrack/core` — no direct PowerSync or Supabase imports.

## Prerequisites

- Task 03 complete
- `packages/core` building cleanly

## Navigation Structure (Expo Router)

```
app/
├── _layout.tsx          ← Root layout, PowerSync provider, auth gate
├── (auth)/
│   └── login.tsx        ← Magic link login screen
└── (app)/
    ├── _layout.tsx      ← Tab layout (Home, Scan)
    ├── index.tsx        ← Home screen (box list)
    ├── scan.tsx         ← QR scanner screen
    ├── box/
    │   ├── [id].tsx     ← Box detail screen
    │   └── edit/
    │       └── [id].tsx ← Edit box screen
    └── box/
        └── new.tsx      ← Add box screen (receives qr_code param)
```

## Screen Requirements

### Root Layout (`app/_layout.tsx`)
- Wrap app in PowerSync provider using `db` from `@boxtrack/core`
- Check auth on mount — redirect to `(auth)/login` if no session
- Subscribe to PowerSync sync status, update Zustand store

### Login Screen (`app/(auth)/login.tsx`)
- Email input + "Send magic link" button
- Success state: "Check your email" message
- No password field — magic link only

### Home Screen (`app/(app)/index.tsx`)
- Search input at top — filters via `searchBoxes()` from core when query present, `getAllBoxes()` otherwise
- Box list sorted by `updated_at DESC`
- Each row shows: box name, item count, first 3 items as preview
- Empty state: distinguish between "no boxes yet" and "syncing for first time" using `syncStatus` from Zustand store
- Offline badge in header when `syncStatus === 'offline'`
- Tap row → navigate to `box/[id]`
- FAB (floating action button) → navigate to `box/new`

### Scanner Screen (`app/(app)/scan.tsx`)
- Use `expo-barcode-scanner`
- Camera is always-on when screen is mounted — no tap to activate
- On successful decode:
  - Query `getBoxByQrCode(code)` from core
  - Found → navigate to `box/[id]`
  - Not found → navigate to `box/new?qr_code=[code]`
- Debounce: disable scanner for 2 seconds after successful scan to prevent double-navigation
- Camera permission denied: show explanation text + button that opens `Linking.openSettings()`
- Do not show a blank screen for any permission state

### Box Detail Screen (`app/(app)/box/[id].tsx`)
- Read-only display of name, items (as tags), notes
- Edit button → navigate to `box/edit/[id]`
- Delete button → confirm dialog → `deleteBox(id)` → navigate back to Home
- Subscribe reactively: if box disappears from local DB (deleted on another device), navigate back to Home with a toast — do not crash on null

### Add Box Screen (`app/(app)/box/new.tsx`)
- Reads optional `qr_code` param from route
- If `qr_code` param present: display it as non-editable, show "Scanned" badge
- If no param: `qr_code` field is editable text input
- Fields: qr_code, name, items (comma-separated text input), notes
- On save: validate with `boxInputSchema` from core, call `createBox()`, navigate to the new box's detail screen
- Inline validation errors on each field

### Edit Box Screen (`app/(app)/box/edit/[id].tsx`)
- Pre-populated from `getBoxById(id)`
- `qr_code` is always non-editable (display only)
- On save: validate with `boxUpdateSchema`, call `updateBox()`, navigate back to detail screen
- Inline validation errors on each field

## Acceptance Criteria

- [ ] All screens implemented
- [ ] No imports of `@powersync/react-native` or `@supabase/supabase-js` in `apps/mobile/src`
- [ ] Camera permission denied state handled on Scanner screen
- [ ] Scanner debounce implemented (2 second cooldown after successful scan)
- [ ] Box Detail handles null box gracefully (back-navigation, not crash)
- [ ] Empty state on Home distinguishes syncing vs. genuinely empty
- [ ] Offline badge visible in Home header when offline

## Verification

```bash
cd apps/mobile && pnpm run type-check && pnpm run lint
```

Then run on simulator:
```bash
pnpm run ios
```

Manually verify:
- Login flow works end-to-end
- Can add a box manually
- Home list shows the new box
- Can edit and delete the box
- Scanner screen opens camera without error

Fix all type errors and lint warnings before finishing.
