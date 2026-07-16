-- Keep registration rows aligned with the admin payment screens.

alter table public.students
add column if not exists paid_amount numeric default 0;

alter table public.students
add column if not exists remaining_amount numeric;

alter table public.students
alter column paid_amount set default 0;

update public.students
set
  paid_amount = coalesce(paid_amount, 0),
  remaining_amount = coalesce(
    remaining_amount,
    greatest(coalesce(fee, 0) - coalesce(paid_amount, 0), 0)
  ),
  payment_status = coalesce(payment_status, 'Pending'),
  payment_method = coalesce(payment_method, 'Not Selected'),
  payment_reference = coalesce(payment_reference, 'Not Provided')
where
  paid_amount is null
  or remaining_amount is null
  or payment_status is null
  or payment_method is null
  or payment_reference is null;

create index if not exists students_student_id_idx
on public.students(student_id);

create index if not exists students_phone_idx
on public.students(phone);

create index if not exists students_email_lower_idx
on public.students(lower(email));

create or replace function public.prepare_student_registration_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.paid_amount := coalesce(new.paid_amount, 0);

  if new.remaining_amount is null then
    new.remaining_amount := greatest(
      coalesce(new.fee, 0) - new.paid_amount,
      0
    );
  end if;

  new.payment_status := coalesce(new.payment_status, 'Pending');
  new.payment_method := coalesce(new.payment_method, 'Not Selected');
  new.payment_reference := coalesce(
    new.payment_reference,
    'Not Provided'
  );

  return new;
end;
$$;

drop trigger if exists prepare_student_registration_defaults_before_insert
on public.students;

create trigger prepare_student_registration_defaults_before_insert
before insert on public.students
for each row
execute function public.prepare_student_registration_defaults();
