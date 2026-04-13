# Task 02 — Supabase Schema & Migrations

Read CLAUDE.md and ARCHITECTURE.md before starting. Pay close attention to the Row Level Security section.

## Goal

Define the database schema, migrations, and RLS policies. This is the source of truth for the entire data layer.

## Prerequisites

- Task 01 complete
- A Supabase project created at supabase.com
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` available

## Acceptance Criteria

- [ ] Supabase CLI installed and configured (`supabase init` run from repo root)
- [ ] `supabase/migrations/` directory created with initial migration file
- [ ] Migration creates the `boxes` table:

```sql
create table boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  qr_code     text unique not null,
  name        text not null,
  items       text[] not null default '{}',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

- [ ] Migration enables RLS on `boxes`:

```sql
alter table boxes enable row level security;

create policy "boxes_select" on boxes
  for select using (user_id = auth.uid());

create policy "boxes_insert" on boxes
  for insert with check (user_id = auth.uid());

create policy "boxes_update" on boxes
  for update using (user_id = auth.uid());

create policy "boxes_delete" on boxes
  for delete using (user_id = auth.uid());
```

- [ ] Migration creates `updated_at` auto-update trigger:

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boxes_updated_at
  before update on boxes
  for each row execute function update_updated_at();
```

- [ ] `.env.example` at repo root documenting required environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `POWERSYNC_URL` (placeholder — filled in Task 03)

- [ ] `packages/core/src/env.ts` that reads and validates env vars with Zod, throws clearly if any are missing

## Verification

```bash
supabase db push
```

Confirm in Supabase dashboard that:
- `boxes` table exists with all columns
- RLS is enabled (shield icon visible)
- All 4 policies exist
- Trigger exists on the table

Do not proceed if the migration fails or RLS is not enabled.
