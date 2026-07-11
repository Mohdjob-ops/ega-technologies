create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  student_name text,
  amount numeric not null check (amount > 0),
  payment_method text not null
    check (payment_method in ('Bank Transfer', 'Cash / Office')),
  payment_reference text,
  note text,
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Rejected')),
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz not null default now()
);

create index if not exists payment_requests_student_id_idx
on public.payment_requests(student_id);

create index if not exists payment_requests_status_idx
on public.payment_requests(status);

alter table public.payment_requests enable row level security;

drop policy if exists "Allow public payment request submissions"
on public.payment_requests;

create policy "Allow public payment request submissions"
on public.payment_requests
for insert
to anon, authenticated
with check (
  status = 'Pending'
  and payment_method in ('Bank Transfer', 'Cash / Office')
  and amount > 0
);

grant insert on public.payment_requests to anon, authenticated;
grant select, update on public.payment_requests to authenticated;
