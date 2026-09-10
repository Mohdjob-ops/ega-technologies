-- Enforce closed service-session duration from complete UTC timestamps.
-- This is intentionally separate from the already-applied service-hours migrations.

create or replace function public.sync_closed_service_hour_duration()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  elapsed integer;
begin
  if new.ended_at is not null then
    elapsed := greatest(
      0,
      floor(extract(epoch from (new.ended_at - new.started_at)))::integer
    );
    new.active_seconds := elapsed;
    new.extra_seconds := greatest(0, elapsed - new.required_seconds);
    if new.completed_at is null
       and new.required_seconds > 0
       and elapsed >= new.required_seconds then
      new.completed_at := new.ended_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_closed_service_hour_duration on public.service_hour_sessions;
create trigger sync_closed_service_hour_duration
before insert or update on public.service_hour_sessions
for each row execute function public.sync_closed_service_hour_duration();

revoke all on function public.sync_closed_service_hour_duration() from public, anon, authenticated;
