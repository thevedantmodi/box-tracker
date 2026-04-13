# Task 05 — Mobile App: QR Scanner Integration & End-to-End Test

Read ARCHITECTURE.md QR scan flow section before starting.

## Goal

Verify the full QR scan → lookup → create/view flow works correctly on a real device or simulator. Fix any issues found.

## Prerequisites

- Task 04 complete
- App running on iOS simulator or physical device via `pnpm run ios`

## Test Scenarios

Work through each scenario manually. Fix any bugs found before moving to the next scenario.

### Scenario A — Scan known QR code
1. Add a box manually from the Home screen with any QR code string (e.g. "BOX-001")
2. Navigate to Scanner
3. Display a QR code encoding "BOX-001" on another screen or printed
4. Scan it
5. **Expected:** Navigate directly to that box's Detail screen

### Scenario B — Scan unknown QR code
1. Navigate to Scanner
2. Scan a QR code that does not exist in the database
3. **Expected:** Navigate to Add Box screen with `qr_code` field pre-filled and locked, showing a "Scanned" badge
4. Complete the form and save
5. **Expected:** Navigate to the new box's Detail screen

### Scenario C — Rapid double scan (debounce)
1. Navigate to Scanner
2. Scan the same QR code twice in quick succession
3. **Expected:** Only one navigation occurs — no double-push on the navigation stack

### Scenario D — Camera permission denied
1. Revoke camera permission for the app in iOS Settings
2. Open the Scanner screen
3. **Expected:** Explanation text is shown, with a button that opens iOS Settings
4. Grant permission, return to app, open Scanner again
5. **Expected:** Camera opens normally

### Scenario E — Offline scan
1. Enable Airplane Mode on the device
2. Scan a QR code for a box that was previously synced
3. **Expected:** Box detail loads immediately from local SQLite — no loading spinner, no error

## Acceptance Criteria

- [ ] All 5 scenarios pass
- [ ] No crashes in any scenario
- [ ] No navigation stack corruption (back button always goes to the right screen)

## Verification

```bash
cd apps/mobile && pnpm run test
```

Add unit tests for:
- `getBoxByQrCode` returns correct box when found
- `getBoxByQrCode` returns null when not found
- Scanner debounce logic (mock timers)

Minimum 3 unit tests added for this task.
