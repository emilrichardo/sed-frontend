-- Run this in your Supabase SQL Editor to enable Drive Sync tracking

create table if not exists drive_sync_state (
  id uuid default gen_random_uuid() primary key,
  file_id text not null unique,
  file_name text,
  processed_at timestamp with time zone default now(),
  status text default 'pending', -- 'success', 'failed', 'skipped_duplicate'
  boletin_id text -- ID of the created bulletin in Payload
);

-- Enable RLS (Optional, but good practice)
alter table drive_sync_state enable row level security;

-- Allow Service Role (Backend) full access
create policy "Enable all access for service role" on drive_sync_state
  using (true)
  with check (true);
