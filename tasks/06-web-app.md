# Task 06 — Web App

Read CLAUDE.md and ARCHITECTURE.md before starting. The web app is a secondary client — same data layer, lighter offline guarantees.

## Goal

Build the Vite + React web app. It shares `packages/core` with the mobile app, so all data access is already done. This task is mostly UI.

## Prerequisites

- Task 03 complete (`packages/core` building cleanly)
- Task 04 complete (mobile app exists as a reference for behavior)

## What's Different on Web

- QR scanning uses `jsQR` + `getUserMedia` instead of `expo-barcode-scanner`
- No Expo Router — use React Router v6
- Offline support is best-effort (PowerSync web SDK uses IndexedDB), not guaranteed
- Styling: plain CSS modules or Tailwind — no React Native StyleSheet

## Route Structure

```
/                → Home (box list)
/scan            → QR scanner
/box/:id         → Box detail
/box/:id/edit    → Edit box
/box/new         → Add box (optional ?qr_code= param)
/login           → Login
```

## Screen Requirements

Match mobile behavior exactly per ARCHITECTURE.md Screen Logic section, with these web-specific notes:

### Scanner (`/scan`)
- Use `getUserMedia({ video: { facingMode: 'environment' } })` for rear camera
- Use `jsQR` to decode frames from a `<canvas>` element (poll every 300ms while tab is active)
- Stop the camera stream when navigating away from `/scan` (release the camera)
- Permission denied: show explanation + link to browser settings (cannot deep-link on web, just instruct the user)
- Works in Chrome and Safari on iOS — test both

### General
- Mobile-first layout — this is primarily used on phones, not desktops
- Offline badge when PowerSync reports offline status
- No loading spinners waiting for network (same rule as mobile)

## Acceptance Criteria

- [ ] All routes implemented
- [ ] No imports of `@powersync/react-native` in `apps/web/src`
- [ ] Camera stream is stopped when leaving `/scan`
- [ ] Login flow works (magic link)
- [ ] CRUD operations work (create, view, edit, delete)
- [ ] Search works on Home screen
- [ ] Runs without errors on mobile Chrome and Safari

## Verification

```bash
cd apps/web && pnpm run type-check && pnpm run lint && pnpm run build
```

The build must succeed with no TypeScript errors. Fix all issues before finishing.

Then run dev server and manually verify all routes:
```bash
pnpm run dev
```
