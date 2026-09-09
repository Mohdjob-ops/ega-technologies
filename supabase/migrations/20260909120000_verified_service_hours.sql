-- Verified service time is accumulated only from bounded, active heartbeats.
alter table public.service_hour_sessions
  add column if not exists last_heartbeat_at timestamptz,
  add column if not exists last_active_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.service_hour_sessions
  alter column last_heartbeat_at set default now(),
  alter column last_active_at set default now();

create or replace function public.record_service_heartbeat(
  p_session_id uuid,
  p_heartbeat_at timestamptz,
  p_active_at timestamptz,
  p_max_interval_seconds integer default 30
)
returns public.service_hour_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  current_session public.service_hour_sessions;
  interval_seconds integer;
  accepted_seconds integer := 0;
begin
  select * into current_session
  from public.service_hour_sessions
  where id = p_session_id and ended_at is null
  for update;

  if not found then
    raise exception 'Open service session not found';
  end if;

  if p_heartbeat_at < current_session.last_heartbeat_at
     or p_active_at > p_heartbeat_at
     or p_heartbeat_at - p_active_at > interval '45 seconds' then
    return current_session;
  end if;

  interval_seconds := floor(extract(epoch from (p_heartbeat_at - current_session.last_heartbeat_at)))::integer;
  if interval_seconds between 1 and greatest(1, least(p_max_interval_seconds, 45))
     and p_heartbeat_at - current_session.last_heartbeat_at <= interval '45 seconds' then
    accepted_seconds := interval_seconds;
  end if;

  update public.service_hour_sessions
  set active_seconds = active_seconds + accepted_seconds,
      last_heartbeat_at = p_heartbeat_at,
      last_active_at = p_active_at,
      last_activity_at = p_active_at,
      extra_seconds = greatest(0, active_seconds + accepted_seconds - required_seconds),
      completed_at = case
        when active_seconds + accepted_seconds >= required_seconds and required_seconds > 0
          then coalesce(completed_at, p_heartbeat_at)
        else completed_at
      end,
      updated_at = now()
  where id = current_session.id
  returning * into current_session;

  return current_session;
end;
$$;

revoke all on function public.record_service_heartbeat(uuid, timestamptz, timestamptz, integer) from public, anon, authenticated;

create or replace function public.prevent_direct_service_time_edits()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('service_role', 'postgres') and (
    new.active_seconds <> old.active_seconds
    or new.last_heartbeat_at is distinct from old.last_heartbeat_at
    or new.last_active_at is distinct from old.last_active_at
    or new.extra_seconds is distinct from old.extra_seconds
    or new.completed_at is distinct from old.completed_at
  ) then
    raise exception 'Verified service time is server controlled';
  end if;
  if current_user not in ('service_role', 'postgres')
     and new.approval_status = 'rejected'
     and length(trim(coalesce(new.rejection_reason, ''))) = 0 then
    raise exception 'A rejection reason is required';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_direct_service_time_edits on public.service_hour_sessions;
create trigger protect_direct_service_time_edits
before update on public.service_hour_sessions
for each row execute function public.prevent_direct_service_time_edits();