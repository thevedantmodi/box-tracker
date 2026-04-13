# Task 03 — packages/core Data Layer

Read CLAUDE.md and ARCHITECTURE.md before starting. The packages/core boundary section is critical — all PowerSync and Supabase imports must live here and nowhere else.

## Goal

Build the entire data layer in `packages/core`. Both apps will consume this package — they must not import PowerSync or Supabase directly.

## Prerequisites

- Tasks 01 and 02 complete
- PowerSync project created at powersync.com and connected to Supabase
- `POWERSYNC_URL` available

## What to Build

### 1. Types (`src/types/index.ts`)

```typescript
export type Box = {
  id: string
  user_id: string
  qr_code: string
  name: string
  items: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export type BoxInput = {
  qr_code: string
  name: string
  items: string[]
  notes?: string
}

export type BoxUpdate = Partial<Omit<BoxInput, 'qr_code'>>
```

### 2. Zod Validation (`src/validation/index.ts`)

- `boxInputSchema` — validates `BoxInput`, name required and non-empty, items array of non-empty strings, notes optional string
- `boxUpdateSchema` — validates `BoxUpdate`, all fields optional, same constraints
- Export inferred TypeScript types alongside each schema

### 3. PowerSync Client (`src/db/client.ts`)

- Initialize PowerSync with the Supabase connector
- Export a `db` singleton — this is the only PowerSync instance in the entire app
- The client must not be initialized until `db.connect()` is explicitly called (auth happens first)
- Handle the PowerSync schema registration for the `boxes` table

### 4. Box Queries (`src/db/queries.ts`)

All queries go through the `db` singleton from `client.ts`. No direct Supabase queries.

- `getAllBoxes(): Promise<Box[]>` — SELECT all, sorted by `updated_at DESC`
- `getBoxById(id: string): Promise<Box | null>`
- `getBoxByQrCode(qrCode: string): Promise<Box | null>`
- `searchBoxes(query: string): Promise<Box[]>` — searches name, items (cast to text), and notes via LIKE

### 5. Box Mutations (`src/db/mutations.ts`)

- `createBox(input: BoxInput, userId: string): Promise<string>` — returns new box id
- `updateBox(id: string, update: BoxUpdate): Promise<void>`
- `deleteBox(id: string): Promise<void>`

All mutations must validate input with Zod before writing. Throw a typed `ValidationError` if validation fails.

### 6. Zustand Store (`src/store/boxes.ts`)

```typescript
type BoxesStore = {
  // State
  boxes: Box[]
  searchQuery: string
  isLoading: boolean
  syncStatus: 'online' | 'offline' | 'syncing'

  // Actions
  setBoxes: (boxes: Box[]) => void
  setSearchQuery: (query: string) => void
  setSyncStatus: (status: BoxesStore['syncStatus']) => void
}
```

### 7. Public API (`src/index.ts`)

Export everything the apps need:
- All types
- All Zod schemas
- `db` client
- All query functions
- All mutation functions
- The Zustand store hook

Do NOT export internal implementation details.

## Acceptance Criteria

- [ ] All files above created
- [ ] No imports of `@powersync/react-native` or `@supabase/supabase-js` outside of `packages/core`
- [ ] Every mutation validates with Zod before touching the DB
- [ ] `ValidationError` is a typed error class, not a plain `Error`
- [ ] `src/index.ts` is the single export surface

## Verification

```bash
cd packages/core && pnpm run build && pnpm run type-check
```

Fix all type errors before finishing. The build must produce clean output.
