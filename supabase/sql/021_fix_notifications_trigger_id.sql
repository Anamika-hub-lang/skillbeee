-- Hard-fix notification inserts even when `notifications.id` default is missing.
-- Run once in Supabase SQL Editor.

alter table public.notifications
  alter column id set default gen_random_uuid();

alter table public.notifications
  alter column "createdAt" set default now();

create or replace function public.notify_client_on_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
  v_title text;
begin
  select r."clientId", r.title into v_client, v_title
  from public.requirements r
  where r.id = new."requirementId";

  if v_client is null then
    return new;
  end if;

  insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
  values (
    gen_random_uuid(),
    v_client,
    'New application',
    'A student applied to “' || left(v_title, 200) || '”.',
    'application'::"NotificationType",
    false,
    jsonb_build_object('requirementId', new."requirementId", 'applicationId', new.id),
    now()
  );
  return new;
end;
$$;

create or replace function public.notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  preview text;
  rec record;
begin
  select id, title, "clientId" into r from public.requirements where id = new."requirementId";
  if not found then
    return new;
  end if;

  preview := left(new.body, 140);
  if length(new.body) > 140 then
    preview := left(new.body, 137) || '…';
  end if;

  if new."senderId" = r."clientId" then
    for rec in
      select distinct a."studentId" as sid
      from public.applications a
      where a."requirementId" = r.id
        and a.status in ('pending'::"ApplicationStatus", 'accepted'::"ApplicationStatus")
    loop
      if rec.sid is null or rec.sid = new."senderId" then
        continue;
      end if;
      insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
      values (gen_random_uuid(), rec.sid, r.title, preview, 'message'::"NotificationType", false, jsonb_build_object('requirementId', r.id), now());
    end loop;
  else
    if r."clientId" is not null and r."clientId" <> new."senderId" then
      insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
      values (gen_random_uuid(), r."clientId", r.title, preview, 'message'::"NotificationType", false, jsonb_build_object('requirementId', r.id), now());
    end if;
  end if;

  return new;
end;
$$;

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
    values (gen_random_uuid(), new."studentId", 'You are matched!', 'The client accepted your application for “' || coalesce(v_title, 'this task') || '”. Open chat to start.', 'match'::"NotificationType", false, jsonb_build_object('requirementId', new."requirementId", 'applicationId', new.id), now());
  elsif new.status = 'rejected'::"ApplicationStatus" then
    insert into public.notifications (id, "userId", title, body, type, read, data, "createdAt")
    values (gen_random_uuid(), new."studentId", 'Application update', 'Another student was selected for “' || coalesce(v_title, 'this task') || '”.', 'application'::"NotificationType", false, jsonb_build_object('requirementId', new."requirementId", 'applicationId', new.id), now());
  end if;

  return new;
end;
$$;

notify pgrst, 'reload schema';
