-- Create boxes table
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

-- Enable Row Level Security
alter table boxes enable row level security;

-- RLS policies: users can only access their own boxes
create policy "boxes_select" on boxes
  for select using (user_id = auth.uid());

create policy "boxes_insert" on boxes
  for insert with check (user_id = auth.uid());

create policy "boxes_update" on boxes
  for update using (user_id = auth.uid());

create policy "boxes_delete" on boxes
  for delete using (user_id = auth.uid());

-- Auto-update updated_at on every row update
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
