
-- Prevent duplicate or invalid manual payment requests.

-- Clean existing duplicate pending requests first.
with ranked_pending as (
  select
    id,
    row_number() over (
      partition by student_id
      order by created_at desc
    ) as request_number
  from public.payment_requests
  where status = 'Pending'
)
update public.payment_requests pr
set
  status = 'Rejected',
  reviewed_at = now(),
  reviewed_by = 'System - duplicate cleanup'
from ranked_pending rp
where pr.id = rp.id
  and rp.request_number > 1;

-- Reject pending requests for students already fully paid.
update public.payment_requests pr
set
  status = 'Rejected',
  reviewed_at = now(),
  reviewed_by = 'System - student already paid'
from public.students s
where pr.student_id = s.student_id
  and pr.status = 'Pending'
  and (
    s.payment_status = 'Paid'
    or coalesce(s.remaining_amount, 0) <= 0
  );

-- Only one pending request is allowed per student.
create unique index if not exists
payment_requests_one_pending_per_student_idx
on public.payment_requests(student_id)
where status = 'Pending';

-- Validate every new payment request at database level.
create or replace function public.validate_payment_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students%rowtype;
  v_remaining numeric;
begin
  select *
  into v_student
  from public.students
  where student_id = new.student_id;

  if not found then
    raise exception 'Student record not found';
  end if;

  v_remaining := coalesce(
    v_student.remaining_amount,
    greatest(
      coalesce(v_student.fee, 0) -
      coalesce(v_student.paid_amount, 0),
      0
    )
  );

  if v_student.payment_status = 'Paid' or v_remaining <= 0 then
    raise exception
      'This student is already fully paid. Another payment request is not allowed';
  end if;

  if new.amount > v_remaining then
    raise exception
      'Requested amount (%) is greater than the remaining balance (%)',
      new.amount,
      v_remaining;
  end if;

  if exists (
    select 1
    from public.payment_requests pr
    where pr.student_id = new.student_id
      and pr.status = 'Pending'
  ) then
    raise exception
      'This student already has a pending payment request';
  end if;

  new.student_name := coalesce(
    nullif(trim(new.student_name), ''),
    v_student.name
  );

  new.status := 'Pending';
  new.reviewed_at := null;
  new.reviewed_by := null;

  return new;
end;
$$;

drop trigger if exists
validate_payment_request_before_insert
on public.payment_requests;

create trigger validate_payment_request_before_insert
before insert on public.payment_requests
for each row
execute function public.validate_payment_request_insert();

-- Replace the admin review function and automatically close duplicates.
create or replace function public.admin_review_payment_request(
  p_request_id uuid,
  p_action text,
  p_admin_password text,
  p_reviewed_by text default 'EGA Admin'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.payment_requests%rowtype;
  v_student public.students%rowtype;
  v_old_paid numeric;
  v_old_remaining numeric;
  v_new_paid numeric;
  v_new_remaining numeric;
  v_new_status text;
begin
  if p_admin_password <> 'EGAADMIN2026' then
    raise exception 'Invalid admin password';
  end if;

  if p_action not in ('Approved', 'Rejected') then
    raise exception 'Action must be Approved or Rejected';
  end if;

  select *
  into v_request
  from public.payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payment request not found';
  end if;

  if v_request.status <> 'Pending' then
    raise exception 'This payment request has already been reviewed';
  end if;

  if p_action = 'Rejected' then
    update public.payment_requests
    set
      status = 'Rejected',
      reviewed_at = now(),
      reviewed_by = coalesce(
        nullif(trim(p_reviewed_by), ''),
        'EGA Admin'
      )
    where id = p_request_id;

    return jsonb_build_object(
      'success', true,
      'status', 'Rejected',
      'message', 'Payment request rejected'
    );
  end if;

  select *
  into v_student
  from public.students
  where student_id = v_request.student_id
  for update;

  if not found then
    raise exception 'Student record not found';
  end if;

  v_old_paid := coalesce(v_student.paid_amount, 0);

  v_old_remaining := coalesce(
    v_student.remaining_amount,
    greatest(
      coalesce(v_student.fee, 0) - v_old_paid,
      0
    )
  );

  if v_old_remaining <= 0 then
    raise exception 'The student is already fully paid';
  end if;

  if v_request.amount > v_old_remaining then
    raise exception
      'Requested amount (%) is greater than the student remaining balance (%)',
      v_request.amount,
      v_old_remaining;
  end if;

  v_new_paid := v_old_paid + v_request.amount;
  v_new_remaining := greatest(
    v_old_remaining - v_request.amount,
    0
  );

  if v_new_remaining = 0 then
    v_new_status := 'Paid';
  else
    v_new_status := 'Partial';
  end if;

  update public.students
  set
    paid_amount = v_new_paid,
    remaining_amount = v_new_remaining,
    payment_status = v_new_status,
    payment_method = v_request.payment_method,
    payment_reference = v_request.payment_reference,
    paid_at = now()
  where student_id = v_request.student_id;

  insert into public.transactions (
    student_id,
    student_name,
    amount,
    payment_method,
    note
  )
  values (
    v_request.student_id,
    coalesce(v_request.student_name, v_student.name),
    v_request.amount,
    v_request.payment_method,
    concat(
      'Approved payment request',
      case
        when nullif(
          trim(coalesce(v_request.payment_reference, '')),
          ''
        ) is not null
        then ' - Reference: ' || v_request.payment_reference
        else ''
      end
    )
  );

  update public.payment_requests
  set
    status = 'Approved',
    reviewed_at = now(),
    reviewed_by = coalesce(
      nullif(trim(p_reviewed_by), ''),
      'EGA Admin'
    )
  where id = p_request_id;

  -- Automatically reject any other pending requests for this student.
  update public.payment_requests
  set
    status = 'Rejected',
    reviewed_at = now(),
    reviewed_by = 'System - another request approved'
  where student_id = v_request.student_id
    and id <> p_request_id
    and status = 'Pending';

  return jsonb_build_object(
    'success', true,
    'status', 'Approved',
    'student_id', v_request.student_id,
    'approved_amount', v_request.amount,
    'paid_amount', v_new_paid,
    'remaining_amount', v_new_remaining,
    'payment_status', v_new_status,
    'message',
      'Payment request approved and student payment updated'
  );
end;
$$;

revoke all on function
public.validate_payment_request_insert()
from public;

revoke all on function
public.admin_review_payment_request(uuid, text, text, text)
from public;

grant execute on function
public.admin_review_payment_request(uuid, text, text, text)
to anon, authenticated;
