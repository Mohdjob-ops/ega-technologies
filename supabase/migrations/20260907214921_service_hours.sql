-- EGA Service Hours
-- Admin requirement: 8 active hours / 24 hours
-- E8 requirement: 4 active hours / 24 hours

alter table public.students
add column if not exists is_e8 boolean not null default false;

alter table public.students
add column if not exists e8_since timestamptz;

create table if not exists public.service_hour_sessions (
  id uuid primary key default gen_random_uuid(),
  person_type text not null check (person_type in ('admin', 'e8')),
  person_id text not null,
  service_date date not null,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  ended_at timestamptz,
  active_seconds integer not null default 0,
  required_seconds integer not null,
  completed_at timestamptz,
  extra_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_hour_sessions
enable row level security;

revoke all on public.service_hour_sessions from anon, authenticated;
