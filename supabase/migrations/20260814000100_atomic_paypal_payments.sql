create table if not exists public.paypal_payment_attempts (
  order_id text primary key,
  student_id text not null,
  expected_amount_etb numeric not null check (expected_amount_etb > 0),
  paypal_amount numeric not null check (paypal_amount > 0),
  paypal_currency text not null default 'USD',
  status text not null default 'Created',
  capture_id text unique,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.paypal_payment_attempts enable row level security;

revoke all on public.paypal_payment_attempts from anon, authenticated;
grant all on public.paypal_payment_attempts to service_role;

create or replace function public.record_paypal_payment_attempt(
  p_student_id text,
  p_order_id text,
  p_expected_amount_etb numeric,
  p_paypal_amount numeric,
  p_paypal_currency text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_student_id), '') is null
     or nullif(trim(p_order_id), '') is null
     or p_expected_amount_etb is null
     or p_expected_amount_etb <= 0
     or p_paypal_amount is null
     or p_paypal_amount <= 0
     or nullif(trim(p_paypal_currency), '') is null then
    raise exception 'Invalid PayPal payment attempt';
  end if;

  if not exists (
    select 1 from public.students
    where student_id = trim(p_student_id)
  ) then
    raise exception 'Student was not found';
  end if;

  insert into public.paypal_payment_attempts (
    order_id,
    student_id,
    expected_amount_etb,
    paypal_amount,
    paypal_currency
  ) values (
    trim(p_order_id),
    trim(p_student_id),
    p_expected_amount_etb,
    p_paypal_amount,
    upper(trim(p_paypal_currency))
  );
end;
$$;

create or replace function public.apply_verified_paypal_payment(
  p_student_id text,
  p_order_id text,
  p_capture_id text,
  p_paypal_amount numeric,
  p_paypal_currency text,
  p_paid_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.paypal_payment_attempts%rowtype;
  v_student public.students%rowtype;
  v_fee numeric;
  v_old_paid numeric;
  v_new_paid numeric;
  v_new_remaining numeric;
  v_new_status text;
  v_paid_at timestamptz;
begin
  select * into v_attempt
  from public.paypal_payment_attempts
  where order_id = trim(p_order_id)
    and student_id = trim(p_student_id)
  for update;

  if not found then
    raise exception 'PayPal payment attempt was not found';
  end if;

  select * into v_student
  from public.students
  where student_id = trim(p_student_id)
  for update;

  if not found then
    raise exception 'Student was not found';
  end if;

  if lower(v_attempt.status) = 'verified' then
    if v_attempt.capture_id <> trim(p_capture_id) then
      raise exception 'PayPal order was already verified with another capture';
    end if;

    return jsonb_build_object(
      'already_verified', true,
      'student', to_jsonb(v_student),
      'payment_status', v_student.payment_status,
      'paid_amount', v_student.paid_amount,
      'remaining_amount', v_student.remaining_amount
    );
  end if;

  if nullif(trim(p_capture_id), '') is null
     or p_paypal_amount is null
     or abs(p_paypal_amount - v_attempt.paypal_amount) > 0.01
     or upper(trim(p_paypal_currency)) <> upper(v_attempt.paypal_currency) then
    raise exception 'Captured PayPal amount or currency does not match the order';
  end if;

  v_fee := greatest(coalesce(v_student.fee, 0), 0);
  v_old_paid := greatest(coalesce(v_student.paid_amount, 0), 0);
  v_new_paid := case
    when v_fee > 0 then least(v_old_paid + v_attempt.expected_amount_etb, v_fee)
    else v_old_paid + v_attempt.expected_amount_etb
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
    v_attempt.expected_amount_etb,
    'PayPal',
    'PayPal verified payment: ' || trim(p_capture_id) ||
      ' (order: ' || trim(p_order_id) || ')'
  );

  update public.students
  set payment_status = v_new_status,
      payment_method = 'PayPal',
      payment_reference = trim(p_capture_id),
      paid_amount = v_new_paid,
      remaining_amount = v_new_remaining,
      paid_at = v_paid_at
  where id = v_student.id
  returning * into v_student;

  update public.paypal_payment_attempts
  set status = 'Verified',
      capture_id = trim(p_capture_id),
      verified_at = v_paid_at
  where order_id = v_attempt.order_id;

  return jsonb_build_object(
    'already_verified', false,
    'student', to_jsonb(v_student),
    'payment_status', v_new_status,
    'paid_amount', v_new_paid,
    'remaining_amount', v_new_remaining
  );
end;
$$;

revoke all on function public.record_paypal_payment_attempt(text, text, numeric, numeric, text)
  from public, anon, authenticated;
revoke all on function public.apply_verified_paypal_payment(text, text, text, numeric, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_paypal_payment_attempt(text, text, numeric, numeric, text)
  to service_role;
grant execute on function public.apply_verified_paypal_payment(text, text, text, numeric, text, timestamptz)
  to service_role;
