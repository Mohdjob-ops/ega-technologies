-- Log every registration submit outcome so admins can monitor attempts.

create table if not exists public.registration_attempts (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text,
  email text,
  course text,
  status text not null,
  status_message text,
  student_id text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists registration_attempts_created_at_idx
on public.registration_attempts(created_at desc);

create index if not exists registration_attempts_status_idx
on public.registration_attempts(status);

alter table public.registration_attempts enable row level security;

drop policy if exists "Authenticated users can view registration attempts"
on public.registration_attempts;

create policy "Authenticated users can view registration attempts"
on public.registration_attempts
for select
to authenticated
using (true);

create or replace function public.log_registration_attempt(
  p_full_name text default null,
  p_phone text default null,
  p_email text default null,
  p_course text default null,
  p_status text default 'submitted',
  p_status_message text default null,
  p_student_id text default null,
  p_source text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.registration_attempts (
    full_name,
    phone,
    email,
    course,
    status,
    status_message,
    student_id,
    source
  )
  values (
    nullif(trim(coalesce(p_full_name, '')), ''),
    nullif(trim(coalesce(p_phone, '')), ''),
    lower(nullif(trim(coalesce(p_email, '')), '')),
    nullif(trim(coalesce(p_course, '')), ''),
    coalesce(nullif(trim(p_status), ''), 'submitted'),
    nullif(trim(coalesce(p_status_message, '')), ''),
    nullif(trim(coalesce(p_student_id, '')), ''),
    nullif(trim(coalesce(p_source, '')), '')
  );
end;
$$;

revoke all on function public.log_registration_attempt(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.log_registration_attempt(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text
) to anon, authenticated;
