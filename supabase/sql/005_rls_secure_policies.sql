-- SkillBee: hardened Row Level Security (run in Supabase SQL Editor).
-- Prerequisite: run `004_client_supabase_only.sql` first (triggers, RPCs, RLS enabled).
--
-- This script REPLACES permissive policies (e.g. `users` / `profiles` SELECT using (true))
-- with `auth.uid()`-scoped rules while still allowing the Expo app to read *limited* peer
-- directory data (display name / photo) for open gigs, applicants, and chat contexts.

-- =============================================================================
-- WHERE TO RUN IN SUPABASE
-- =============================================================================
-- 1) Dashboard → SQL → "New query"
-- 2) Paste this entire file → Run
-- 3) If you already ran 004, this file DROPs overlapping policy names then recreates them.
-- 4) Test in SQL: `set request.jwt.claim.sub = '<your-auth-user-uuid>';` is NOT enough for
--    RLS — test from the app or Table editor with a user JWT. Prefer staging project first.

-- =============================================================================
-- USERS  (public.users.id must equal auth.users.id)
-- =============================================================================
drop policy if exists "users_select_auth" on public.users;
drop policy if exists "users_select_scoped" on public.users;
create policy "users_select_scoped"
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.requirements r
      where r."clientId" = users.id
        and r.status = 'open'::"RequirementStatus"
    )
    or exists (
      select 1
      from public.applications a
      join public.requirements r on r.id = a."requirementId"
      where a."studentId" = auth.uid()
        and r."clientId" = users.id
    )
    or exists (
      select 1
      from public.applications a
      join public.requirements r on r.id = a."requirementId"
      where a."studentId" = users.id
        and r."clientId" = auth.uid()
    )
  );

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
  on public.users
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
  on public.users
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "users_delete_none" on public.users;
create policy "users_delete_none"
  on public.users
  for delete
  to authenticated
  using (false);

-- =============================================================================
-- PROFILES  (1:1 with users; nested selects from `users` use these policies)
-- =============================================================================
drop policy if exists "profiles_select_auth" on public.profiles;
drop policy if exists "profiles_select_scoped" on public.profiles;
create policy "profiles_select_scoped"
  on public.profiles
  for select
  to authenticated
  using (
    "userId" = auth.uid()
    or exists (
      select 1
      from public.requirements r
      where r."clientId" = profiles."userId"
        and r.status = 'open'::"RequirementStatus"
    )
    or exists (
      select 1
      from public.applications a
      join public.requirements r on r.id = a."requirementId"
      where a."studentId" = auth.uid()
        and r."clientId" = profiles."userId"
    )
    or exists (
      select 1
      from public.applications a
      join public.requirements r on r.id = a."requirementId"
      where a."studentId" = profiles."userId"
        and r."clientId" = auth.uid()
    )
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check ("userId" = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using ("userId" = auth.uid())
  with check ("userId" = auth.uid());

drop policy if exists "profiles_delete_none" on public.profiles;
create policy "profiles_delete_none"
  on public.profiles
  for delete
  to authenticated
  using (false);

-- =============================================================================
-- REQUIREMENTS
-- =============================================================================
drop policy if exists "req_select_participants" on public.requirements;
drop policy if exists "req_insert_client" on public.requirements;
drop policy if exists "req_update_owner" on public.requirements;
drop policy if exists "req_delete_owner" on public.requirements;
create policy "req_select_participants"
  on public.requirements
  for select
  to authenticated
  using (
    status = 'open'::"RequirementStatus"
    or "clientId" = auth.uid()
    or exists (
      select 1
      from public.applications a
      where a."requirementId" = requirements.id
        and a."studentId" = auth.uid()
    )
  );

drop policy if exists "req_insert_client" on public.requirements;
create policy "req_insert_client"
  on public.requirements
  for insert
  to authenticated
  with check (
    "clientId" = auth.uid()
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'client'::"UserRole"
    )
  );

drop policy if exists "req_update_owner" on public.requirements;
create policy "req_update_owner"
  on public.requirements
  for update
  to authenticated
  using ("clientId" = auth.uid())
  with check ("clientId" = auth.uid());

drop policy if exists "req_delete_owner" on public.requirements;
create policy "req_delete_owner"
  on public.requirements
  for delete
  to authenticated
  using ("clientId" = auth.uid());

-- =============================================================================
-- REQUIREMENT_SKILLS (child of requirement)
-- =============================================================================
drop policy if exists "req_skills_all_owner" on public.requirement_skills;
drop policy if exists "req_skills_select_owner" on public.requirement_skills;
drop policy if exists "req_skills_insert_owner" on public.requirement_skills;
drop policy if exists "req_skills_update_owner" on public.requirement_skills;
drop policy if exists "req_skills_delete_owner" on public.requirement_skills;
create policy "req_skills_select_owner"
  on public.requirement_skills
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and (
          r."clientId" = auth.uid()
          or r.status = 'open'::"RequirementStatus"
          or exists (
            select 1
            from public.applications a
            where a."requirementId" = r.id
              and a."studentId" = auth.uid()
          )
        )
    )
  );

create policy "req_skills_insert_owner"
  on public.requirement_skills
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and r."clientId" = auth.uid()
    )
  );

create policy "req_skills_update_owner"
  on public.requirement_skills
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and r."clientId" = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and r."clientId" = auth.uid()
    )
  );

create policy "req_skills_delete_owner"
  on public.requirement_skills
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and r."clientId" = auth.uid()
    )
  );

-- =============================================================================
-- APPLICATIONS
-- =============================================================================
drop policy if exists "apps_select_participants" on public.applications;
drop policy if exists "apps_insert_student" on public.applications;
drop policy if exists "apps_update_student" on public.applications;
drop policy if exists "apps_delete_student_pending" on public.applications;
create policy "apps_select_participants"
  on public.applications
  for select
  to authenticated
  using (
    "studentId" = auth.uid()
    or exists (
      select 1
      from public.requirements r
      where r.id = "requirementId"
        and r."clientId" = auth.uid()
    )
  );

drop policy if exists "apps_insert_student" on public.applications;
create policy "apps_insert_student"
  on public.applications
  for insert
  to authenticated
  with check (
    "studentId" = auth.uid()
    and exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.role = 'student'::"UserRole"
    )
  );

drop policy if exists "apps_update_student" on public.applications;
create policy "apps_update_student"
  on public.applications
  for update
  to authenticated
  using ("studentId" = auth.uid())
  with check ("studentId" = auth.uid());

drop policy if exists "apps_delete_student_pending" on public.applications;
create policy "apps_delete_student_pending"
  on public.applications
  for delete
  to authenticated
  using (
    "studentId" = auth.uid()
    and status = 'pending'::"ApplicationStatus"
  );

-- =============================================================================
-- PROJECTS (rows created by SECURITY DEFINER RPC `accept_application`; clients do not insert directly)
-- =============================================================================
drop policy if exists "projects_select_participants" on public.projects;
drop policy if exists "projects_insert_none" on public.projects;
drop policy if exists "projects_update_none" on public.projects;
drop policy if exists "projects_delete_none" on public.projects;
create policy "projects_select_participants"
  on public.projects
  for select
  to authenticated
  using ("clientId" = auth.uid() or "studentId" = auth.uid());

drop policy if exists "projects_insert_none" on public.projects;
create policy "projects_insert_none"
  on public.projects
  for insert
  to authenticated
  with check (false);

drop policy if exists "projects_update_none" on public.projects;
create policy "projects_update_none"
  on public.projects
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "projects_delete_none" on public.projects;
create policy "projects_delete_none"
  on public.projects
  for delete
  to authenticated
  using (false);

-- =============================================================================
-- MESSAGES (read receipts via RPC `mark_thread_read`; no direct UPDATE from app)
-- =============================================================================
drop policy if exists "messages_select_participants" on public.messages;
drop policy if exists "messages_insert_participants" on public.messages;
drop policy if exists "messages_update_none" on public.messages;
drop policy if exists "messages_delete_none" on public.messages;
create policy "messages_select_participants"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.requirements r
      where r.id = messages."requirementId"
        and (
          r."clientId" = auth.uid()
          or exists (
            select 1
            from public.applications a
            where a."requirementId" = r.id
              and a."studentId" = auth.uid()
          )
        )
    )
  );

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages
  for insert
  to authenticated
  with check (
    "senderId" = auth.uid()
    and exists (
      select 1
      from public.requirements r
      where r.id = messages."requirementId"
        and (
          r."clientId" = auth.uid()
          or exists (
            select 1
            from public.applications a
            where a."requirementId" = r.id
              and a."studentId" = auth.uid()
          )
        )
    )
  );

drop policy if exists "messages_update_none" on public.messages;
create policy "messages_update_none"
  on public.messages
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "messages_delete_none" on public.messages;
create policy "messages_delete_none"
  on public.messages
  for delete
  to authenticated
  using (false);

-- =============================================================================
-- NOTIFICATIONS (inserts from triggers run as table owner / security definer — not blocked here)
-- =============================================================================
drop policy if exists "notifications_own" on public.notifications;
drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_insert_none" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using ("userId" = auth.uid());

drop policy if exists "notifications_insert_none" on public.notifications;
create policy "notifications_insert_none"
  on public.notifications
  for insert
  to authenticated
  with check (false);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using ("userId" = auth.uid())
  with check ("userId" = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications
  for delete
  to authenticated
  using ("userId" = auth.uid());

-- =============================================================================
-- PAYMENTS & TRANSACTIONS (ledger rows; app is read-heavy)
-- =============================================================================
drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_none" on public.payments;
drop policy if exists "payments_update_none" on public.payments;
drop policy if exists "payments_delete_none" on public.payments;
create policy "payments_select_own"
  on public.payments
  for select
  to authenticated
  using ("payerId" = auth.uid());

drop policy if exists "payments_insert_none" on public.payments;
create policy "payments_insert_none"
  on public.payments
  for insert
  to authenticated
  with check (false);

drop policy if exists "payments_update_none" on public.payments;
create policy "payments_update_none"
  on public.payments
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "payments_delete_none" on public.payments;
create policy "payments_delete_none"
  on public.payments
  for delete
  to authenticated
  using (false);

drop policy if exists "transactions_select_own" on public.transactions;
drop policy if exists "transactions_insert_none" on public.transactions;
drop policy if exists "transactions_update_none" on public.transactions;
drop policy if exists "transactions_delete_none" on public.transactions;
create policy "transactions_select_own"
  on public.transactions
  for select
  to authenticated
  using ("userId" = auth.uid());

drop policy if exists "transactions_insert_none" on public.transactions;
create policy "transactions_insert_none"
  on public.transactions
  for insert
  to authenticated
  with check (false);

drop policy if exists "transactions_update_none" on public.transactions;
create policy "transactions_update_none"
  on public.transactions
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "transactions_delete_none" on public.transactions;
create policy "transactions_delete_none"
  on public.transactions
  for delete
  to authenticated
  using (false);

-- =============================================================================
-- ACTIVITY_LOGS
-- =============================================================================
drop policy if exists "activity_select_own" on public.activity_logs;
drop policy if exists "activity_insert_none" on public.activity_logs;
drop policy if exists "activity_update_none" on public.activity_logs;
drop policy if exists "activity_delete_none" on public.activity_logs;
create policy "activity_select_own"
  on public.activity_logs
  for select
  to authenticated
  using ("actorUserId" = auth.uid());

drop policy if exists "activity_insert_none" on public.activity_logs;
create policy "activity_insert_none"
  on public.activity_logs
  for insert
  to authenticated
  with check (false);

drop policy if exists "activity_update_none" on public.activity_logs;
create policy "activity_update_none"
  on public.activity_logs
  for update
  to authenticated
  using (false)
  with check (false);

drop policy if exists "activity_delete_none" on public.activity_logs;
create policy "activity_delete_none"
  on public.activity_logs
  for delete
  to authenticated
  using (false);
