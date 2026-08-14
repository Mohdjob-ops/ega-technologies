create table if not exists public.chapa_payment_attempts (
  tx_ref text primary key,
  student_id text not null,
  expected_amount numeric not null check (expected_amount > 0),
  currency text not null default 'ETB',
  status text not null default 'Pending',
  verified_amount numeric,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

alter table public.chapa_payment_attempts enable row level security;

revoke all on public.chapa_payment_attempts from anon, authenticated;
grant all on public.chapa_payment_attempts to service_role;

create or replace function public.record_chapa_payment_attempt(
  p_student_id text,
  p_tx_ref text,
  p_expected_amount numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_student_id), '') is null
     or nullif(trim(p_tx_ref), '') is null
     or p_expected_amount is null
     or p_expected_amount <= 0 then
    raise exception 'Invalid Chapa payment attempt';
  end if;

  insert into public.chapa_payment_attempts (
    tx_ref,
    student_id,
    expected_amount
  ) values (
    trim(p_tx_ref),
    trim(p_student_id),
    p_expected_amount
  );

  update public.students
  set payment_method = 'Chapa',
      payment_reference = trim(p_tx_ref),
      remaining_amount = p_expected_amount
  where student_id = trim(p_student_id);

  if not found then
    raise exception 'Student was not found';
  end if;
end;
$$;

create or replace function public.apply_verified_chapa_payment(
  p_student_id text,
  p_tx_ref text,
  p_verified_amount numeric,
  p_payment_method text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.chapa_payment_attempts%rowtype;
  v_student public.students%rowtype;
  v_fee numeric;
  v_old_paid numeric;
  v_new_paid numeric;
  v_new_remaining numeric;
  v_new_status text;
  v_paid_at timestamptz;
begin
  select * into v_attempt
  from public.chapa_payment_attempts
  where tx_ref = trim(p_tx_ref)
    and student_id = trim(p_student_id)
  for update;

  if not found then
    raise exception 'Chapa payment attempt was not found';
  end if;

  select * into v_student
  from public.students
  where student_id = trim(p_student_id)
  for update;

  if not found then
    raise exception 'Student was not found';
  end if;

  if lower(v_attempt.status) = 'verified' then
    return jsonb_build_object(
      'already_verified', true,
      'student', to_jsonb(v_student),
      'payment_status', v_student.payment_status,
      'paid_amount', v_student.paid_amount,
      'remaining_amount', v_student.remaining_amount
    );
  end if;

  if p_verified_amount is null
     or p_verified_amount <= 0
     or abs(p_verified_amount - v_attempt.expected_amount) > 0.01 then
    raise exception 'Verified amount does not match the initialized amount';
  end if;

  v_fee := greatest(coalesce(v_student.fee, 0), 0);
  v_old_paid := greatest(coalesce(v_student.paid_amount, 0), 0);
  v_new_paid := case
    when v_fee > 0 then least(v_old_paid + p_verified_amount, v_fee)
    else v_old_paid + p_verified_amount
  end;
  v_new_remaining := case
    when v_fee > 0 then greatest(v_fee - v_new_paid, 0)
    else 0
  end;
  v_new_status := case when v_new_remaining <= 0 then 'Paid' else 'Partial' end;
  v_paid_at := coalesce(p_paid_at, now());

  insert into public.transactions (
    student_id,
    student_name,
    amount,
    payment_method,
    note
  ) values (
    v_student.student_id,
    coalesce(v_student.name, 'Unknown'),
    p_verified_amount,
    coalesce(nullif(trim(p_payment_method), ''), 'Chapa'),
    'Chapa verified payment: ' || trim(p_tx_ref)
  );

  update public.students
  set payment_status = v_new_status,
      payment_method = coalesce(nullif(trim(p_payment_method), ''), 'Chapa'),
      payment_reference = trim(p_tx_ref),
      paid_amount = v_new_paid,
      remaining_amount = v_new_remaining,
      paid_at = v_paid_at
  where id = v_student.id
  returning * into v_student;

  update public.chapa_payment_attempts
  set status = 'Verified',
      verified_amount = p_verified_amount,
      verified_at = v_paid_at
  where tx_ref = v_attempt.tx_ref;

  return jsonb_build_object(
    'already_verified', false,
    'student', to_jsonb(v_student),
    'payment_status', v_new_status,
    'paid_amount', v_new_paid,
    'remaining_amount', v_new_remaining
  );
end;
$$;

revoke all on function public.record_chapa_payment_attempt(text, text, numeric)
  from public, anon, authenticated;
revoke all on function public.apply_verified_chapa_payment(text, text, numeric, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_chapa_payment_attempt(text, text, numeric)
  to service_role;
grant execute on function public.apply_verified_chapa_payment(text, text, numeric, text, timestamptz)
  to service_role;
