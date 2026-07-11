-- Admin payment request workflow
-- Created: 2026-07-11

create or replace function public.admin_list_payment_requests(
  p_admin_password text
)
returns table (
  id uuid,
  student_id text,
  student_name text,
  amount numeric,
  payment_method text,
  payment_reference text,
  note text,
  status text,
  reviewed_at timestamptz,
  reviewed_by text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_admin_password <> 'EGAADMIN2026' then
    raise exception 'Invalid admin password';
  end if;

  return query
  select
    pr.id,
    pr.student_id,
    pr.student_name,
    pr.amount,
    pr.payment_method,
    pr.payment_reference,
    pr.note,
    pr.status,
    pr.reviewed_at,
    pr.reviewed_by,
    pr.created_at
  from public.payment_requests pr
  order by
    case pr.status
      when 'Pending' then 1
      when 'Approved' then 2
      else 3
    end,
    pr.created_at desc;
end;
$$;

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
      reviewed_by = coalesce(nullif(trim(p_reviewed_by), ''), 'EGA Admin')
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
    greatest(coalesce(v_student.fee, 0) - v_old_paid, 0)
  );

  if v_request.amount > v_old_remaining then
    raise exception
      'Requested amount (%) is greater than the student remaining balance (%)',
      v_request.amount,
      v_old_remaining;
  end if;

  v_new_paid := v_old_paid + v_request.amount;
  v_new_remaining := greatest(v_old_remaining - v_request.amount, 0);

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
        when nullif(trim(coalesce(v_request.payment_reference, '')), '') is not null
          then ' - Reference: ' || v_request.payment_reference
        else ''
      end
    )
  );

  update public.payment_requests
  set
    status = 'Approved',
    reviewed_at = now(),
    reviewed_by = coalesce(nullif(trim(p_reviewed_by), ''), 'EGA Admin')
  where id = p_request_id;

  return jsonb_build_object(
    'success', true,
    'status', 'Approved',
    'student_id', v_request.student_id,
    'approved_amount', v_request.amount,
    'paid_amount', v_new_paid,
    'remaining_amount', v_new_remaining,
    'payment_status', v_new_status,
    'message', 'Payment request approved and student payment updated'
  );
end;
$$;

revoke all on function public.admin_list_payment_requests(text) from public;
revoke all on function public.admin_review_payment_request(uuid, text, text, text) from public;

grant execute on function public.admin_list_payment_requests(text)
to anon, authenticated;

grant execute on function public.admin_review_payment_request(uuid, text, text, text)
to anon, authenticated;
