-- Service dates are Ethiopia dates. A service day runs from 06:00 through
-- 05:59:59 the following day in Africa/Addis_Ababa.
alter table public.service_hour_sessions
  add column if not exists notes text,
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz;

alter table public.service_hour_sessions
  drop constraint if exists service_hour_sessions_person_type_check;

alter table public.service_hour_sessions
  add constraint service_hour_sessions_person_type_check
  check (person_type in ('admin', 'assistant', 'e8'));

alter table public.service_hour_sessions
  drop constraint if exists service_hour_sessions_approval_status_check;

alter table public.service_hour_sessions
  add constraint service_hour_sessions_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

alter table public.service_hour_sessions
  drop constraint if exists service_hour_sessions_time_values_check;

alter table public.service_hour_sessions
  add constraint service_hour_sessions_time_values_check
  check (
    active_seconds >= 0
    and required_seconds >= 0
    and extra_seconds >= 0
    and (ended_at is null or ended_at >= started_at)
  );

create index if not exists service_hour_sessions_service_date_idx
  on public.service_hour_sessions(service_date desc);

create index if not exists service_hour_sessions_person_idx
  on public.service_hour_sessions(person_type, person_id, service_date desc);

create index if not exists service_hour_sessions_approval_idx
  on public.service_hour_sessions(approval_status, service_date desc);

create unique index if not exists service_hour_sessions_one_open_idx
  on public.service_hour_sessions(person_type, person_id)
  where ended_at is null;

alter table public.service_hour_sessions enable row level security;

revoke all on public.service_hour_sessions from anon, authenticated;
grant select on public.service_hour_sessions to authenticated;

drop policy if exists service_hour_sessions_admin_read on public.service_hour_sessions;
create policy service_hour_sessions_admin_read
  on public.service_hour_sessions
  for select to authenticated
  using (public.is_admin());

drop policy if exists service_hour_sessions_admin_update on public.service_hour_sessions;
create policy service_hour_sessions_admin_update
  on public.service_hour_sessions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());