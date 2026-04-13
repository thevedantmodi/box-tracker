# Task 07 — Sync Verification & Polish

Read ARCHITECTURE.md Sync & Offline Behavior section before starting. This task has no new features — it's verification, edge case handling, and polish.

## Goal

Verify that sync works correctly across devices, all documented edge cases are handled, and the app is ready for daily use.

## Prerequisites

- Tasks 01–06 complete
- Mobile app installed on a real iOS device (not just simulator)
- Web app deployed or running locally
- Both connected to the same Supabase project

## Sync Scenarios

Work through each scenario. Fix any issues before marking complete.

### Scenario A — Basic cross-device sync
1. Create a box on the mobile app while online
2. Open the web app on another device or tab
3. **Expected:** Box appears within a few seconds without page refresh

### Scenario B — Offline write syncs on reconnect
1. Enable Airplane Mode on the iOS device
2. Create 2 new boxes, edit 1 existing box, delete 1 existing box
3. Re-enable network
4. **Expected:** All 4 changes appear on the web app within 10 seconds

### Scenario C — Offline badge appears and disappears
1. Enable Airplane Mode
2. Open the app
3. **Expected:** Offline badge visible in Home header
4. Re-enable network
5. **Expected:** Offline badge disappears within a few seconds

### Scenario D — First launch empty state
1. Log in on a fresh install (or clear app data)
2. Before sync completes, check Home screen
3. **Expected:** "Syncing…" empty state, not "No boxes yet"
4. After sync completes
5. **Expected:** Boxes appear, or "No boxes yet" if genuinely empty

### Scenario E — Box deleted on other device while viewing
1. Open Box Detail for a specific box on mobile
2. On web, delete that same box
3. Wait for sync to complete on mobile
4. **Expected:** Mobile app navigates back to Home with a toast — does not crash or show stale data

### Scenario F — Duplicate QR code conflict
1. On mobile (offline), create a box with QR code "TEST-QR"
2. Before syncing, on web, also create a box with QR code "TEST-QR"
3. Re-enable mobile network
4. **Expected:** One of the creates fails with a clear error message — "This QR code is already assigned to [box name]" — not a silent failure or crash

## Polish Checklist

- [ ] Toast messages are shown for: box saved, box deleted, sync error, duplicate QR conflict
- [ ] All forms clear correctly after save
- [ ] Back navigation always lands on the right screen
- [ ] Search input is cleared when navigating away and back on mobile
- [ ] App does not show a splash screen indefinitely if Supabase is unreachable (timeout after 10s, show offline state)
- [ ] No console errors or warnings in production build

## Final Verification

```bash
# Mobile
cd apps/mobile && pnpm run type-check && pnpm run lint && pnpm run test

# Web
cd apps/web && pnpm run type-check && pnpm run lint && pnpm run build

# Core
cd packages/core && pnpm run type-check && pnpm run test
```

All checks must pass cleanly. No skipped tests. No TypeScript errors.
