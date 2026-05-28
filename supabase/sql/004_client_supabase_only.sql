-- SkillBee: client-only app (Expo + Supabase). Run in Supabase SQL Editor AFTER `prisma db push`
-- and AFTER storage buckets (`001` / `003`) exist.
--
-- Provides: auth → public.users mirror, RLS, RPCs used by the app, message/application triggers.

-- --- 1) New Supabase Auth user → public.users + profiles ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, "createdAt", "updatedAt")
  values (new.id, coalesce(new.email, ''), 'student'::"UserRole", now(), now())
  on conflict (id) do update
    set email = excluded.email,
        "updatedAt" = now();

  insert into public.profiles ("userId", "createdAt", "updatedAt")
  values (new.id, now(), now())
  on conflict ("userId") do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- 2) Notifications: application submitted ---
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

drop trigger if exists trg_application_notify on public.applications;
create trigger trg_application_notify
  after insert on public.applications
  for each row execute function public.notify_client_on_application();

-- --- 3) Notifications: new thread message ---
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

drop trigger if exists trg_message_notify on public.messages;
create trigger trg_message_notify
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- --- 4) RPC: accept one student (client only) ---
create or replace function public.accept_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req_id uuid;
  v_client_id uuid;
  v_student_id uuid;
begin
  select a."requirementId", r."clientId", a."studentId"
  into v_req_id, v_client_id, v_student_id
  from public.applications a
  join public.requirements r on r.id = a."requirementId"
  where a.id = p_application_id;

  if v_client_id is null or v_client_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.applications
  set status = 'rejected'::"ApplicationStatus", "updatedAt" = now()
  where "requirementId" = v_req_id and id <> p_application_id and status = 'pending'::"ApplicationStatus";

  update public.applications
  set status = 'accepted'::"ApplicationStatus", "updatedAt" = now()
  where id = p_application_id;

  update public.requirements
  set status = 'matched'::"RequirementStatus", "currentStep" = 'accepted'::"TaskStep", "updatedAt" = now()
  where id = v_req_id;

  if exists (select 1 from public.projects where "requirementId" = v_req_id) then
    return;
  end if;

  insert into public.projects (id, "requirementId", "applicationId", "clientId", "studentId", status, "createdAt", "updatedAt")
  values (gen_random_uuid(), v_req_id, p_application_id, v_client_id, v_student_id, 'active'::"ProjectStatus", now(), now());
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;

-- --- 5) RPC: mark messages read (reader = caller) ---
create or replace function public.mark_thread_read(p_requirement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select exists (
    select 1 from public.requirements r
    where r.id = p_requirement_id
      and (
        r."clientId" = auth.uid()
        or exists (
          select 1 from public.applications a
          where a."requirementId" = r.id and a."studentId" = auth.uid()
        )
      )
  ) into ok;

  if not ok then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.messages
  set "readAt" = now()
  where "requirementId" = p_requirement_id
    and "senderId" <> auth.uid()
    and "readAt" is null;
end;
$$;

grant execute on function public.mark_thread_read(uuid) to authenticated;

-- --- 6) Row Level Security (tune for production) ---
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_skills enable row level security;
alter table public.applications enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payments enable row level security;
alter table public.transactions enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "users_select_auth" on public.users;
create policy "users_select_auth" on public.users for select to authenticated using (true);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self" on public.users for insert to authenticated with check (id = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_select_auth" on public.profiles;
create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check ("userId" = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists "req_select_participants" on public.requirements;
create policy "req_select_participants" on public.requirements for select to authenticated using (
  status = 'open'::"RequirementStatus"
  or "clientId" = auth.uid()
  or exists (select 1 from public.applications a where a."requirementId" = requirements.id and a."studentId" = auth.uid())
);

drop policy if exists "req_insert_client" on public.requirements;
create policy "req_insert_client" on public.requirements for insert to authenticated with check (
  "clientId" = auth.uid()
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'client'::"UserRole"
  )
);

drop policy if exists "req_update_owner" on public.requirements;
create policy "req_update_owner" on public.requirements for update to authenticated using ("clientId" = auth.uid()) with check ("clientId" = auth.uid());

drop policy if exists "req_delete_owner" on public.requirements;
create policy "req_delete_owner" on public.requirements for delete to authenticated using ("clientId" = auth.uid());

drop policy if exists "req_skills_all_owner" on public.requirement_skills;
create policy "req_skills_all_owner" on public.requirement_skills for all to authenticated using (
  exists (select 1 from public.requirements r where r.id = "requirementId" and r."clientId" = auth.uid())
) with check (
  exists (select 1 from public.requirements r where r.id = "requirementId" and r."clientId" = auth.uid())
);

drop policy if exists "apps_select_participants" on public.applications;
create policy "apps_select_participants" on public.applications for select to authenticated using (
  "studentId" = auth.uid()
  or exists (select 1 from public.requirements r where r.id = "requirementId" and r."clientId" = auth.uid())
);

drop policy if exists "apps_insert_student" on public.applications;
create policy "apps_insert_student" on public.applications for insert to authenticated with check (
  "studentId" = auth.uid()
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'student'::"UserRole"
  )
);

drop policy if exists "apps_update_student" on public.applications;
create policy "apps_update_student" on public.applications for update to authenticated using ("studentId" = auth.uid()) with check ("studentId" = auth.uid());

drop policy if exists "projects_select_participants" on public.projects;
create policy "projects_select_participants" on public.projects for select to authenticated using (
  "clientId" = auth.uid() or "studentId" = auth.uid()
);

drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages for select to authenticated using (
  exists (
    select 1 from public.requirements r
    where r.id = messages."requirementId"
      and (
        r."clientId" = auth.uid()
        or exists (select 1 from public.applications a where a."requirementId" = r.id and a."studentId" = auth.uid())
      )
  )
);

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants" on public.messages for insert to authenticated with check (
  "senderId" = auth.uid()
  and exists (
    select 1 from public.requirements r
    where r.id = messages."requirementId"
      and (
        r."clientId" = auth.uid()
        or exists (select 1 from public.applications a where a."requirementId" = r.id and a."studentId" = auth.uid())
      )
  )
);

drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications for select to authenticated using ("userId" = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update to authenticated using ("userId" = auth.uid()) with check ("userId" = auth.uid());

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own" on public.payments for select to authenticated using ("payerId" = auth.uid());

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions for select to authenticated using ("userId" = auth.uid());

drop policy if exists "activity_select_own" on public.activity_logs;
create policy "activity_select_own" on public.activity_logs for select to authenticated using ("actorUserId" = auth.uid());

-- Storage: allow authenticated uploads under own user id or profile-photos/<uid>/...
drop policy if exists "application-samples insert own paths" on storage.objects;
create policy "application-samples insert own paths"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'application-samples'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or name like ('profile-photos/' || auth.uid()::text || '/%')
    )
  );
