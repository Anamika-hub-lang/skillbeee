-- Notify students when a client accepts or rejects their application.

create or replace function public.notify_student_on_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select left(r.title, 200)
  into v_title
  from public.requirements r
  where r.id = new."requirementId";

  if new.status = 'accepted'::"ApplicationStatus" then
    insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
    values (
      gen_random_uuid(),
      new."studentId",
      'You are matched!',
      'The client accepted your application for “' || coalesce(v_title, 'this task') || '”. Open chat to start.',
      'match'::"NotificationType",
      false,
      jsonb_build_object('requirementId', new."requirementId", 'applicationId', new.id),
      now()
    );
  elsif new.status = 'rejected'::"ApplicationStatus" then
    insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
    values (
      gen_random_uuid(),
      new."studentId",
      'Application update',
      'Another student was selected for “' || coalesce(v_title, 'this task') || '”.',
      'application'::"NotificationType",
      false,
      jsonb_build_object('requirementId', new."requirementId", 'applicationId', new.id),
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_application_status_notify on public.applications;
create trigger trg_application_status_notify
  after update of status on public.applications
  for each row execute function public.notify_student_on_application_status();

notify pgrst, 'reload schema';
