-- SkillBee: fix "infinite recursion detected in policy for relation requirements".
-- Cause: requirements <-> applications policies reference each other via subqueries.
-- Fix: SECURITY DEFINER helpers bypass RLS for policy checks.

-- =============================================================================
-- HELPERS (SECURITY DEFINER — no RLS recursion)
-- =============================================================================
create or replace function public.auth_user_owns_requirement(p_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requirements r
    where r.id = p_requirement_id
      and r."clientId" = auth.uid()
  );
$$;

create or replace function public.requirement_is_open(p_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requirements r
    where r.id = p_requirement_id
      and r.status = 'open'::"RequirementStatus"
  );
$$;

create or replace function public.auth_user_applied_to_requirement(p_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a."requirementId" = p_requirement_id
      and a."studentId" = auth.uid()
  );
$$;

create or replace function public.client_has_open_requirement(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requirements r
    where r."clientId" = p_client_id
      and r.status = 'open'::"RequirementStatus"
  );
$$;

create or replace function public.auth_user_applied_to_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.requirements r on r.id = a."requirementId"
    where a."studentId" = auth.uid()
      and r."clientId" = p_client_id
  );
$$;

create or replace function public.auth_client_has_student_applicant(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.requirements r on r.id = a."requirementId"
    where a."studentId" = p_student_id
      and r."clientId" = auth.uid()
  );
$$;

create or replace function public.auth_user_is_requirement_participant(p_requirement_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_user_owns_requirement(p_requirement_id)
      or public.auth_user_applied_to_requirement(p_requirement_id);
$$;

grant execute on function public.auth_user_owns_requirement(uuid) to authenticated;
grant execute on function public.requirement_is_open(uuid) to authenticated;
grant execute on function public.auth_user_applied_to_requirement(uuid) to authenticated;
grant execute on function public.client_has_open_requirement(uuid) to authenticated;
grant execute on function public.auth_user_applied_to_client(uuid) to authenticated;
grant execute on function public.auth_client_has_student_applicant(uuid) to authenticated;
grant execute on function public.auth_user_is_requirement_participant(uuid) to authenticated;

-- =============================================================================
-- USERS
-- =============================================================================
drop policy if exists "users_select_scoped" on public.users;
create policy "users_select_scoped"
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.client_has_open_requirement(id)
    or public.auth_user_applied_to_client(id)
    or public.auth_client_has_student_applicant(id)
  );

-- =============================================================================
-- PROFILES
-- =============================================================================
drop policy if exists "profiles_select_scoped" on public.profiles;
create policy "profiles_select_scoped"
  on public.profiles
  for select
  to authenticated
  using (
    "userId" = auth.uid()
    or public.client_has_open_requirement("userId")
    or public.auth_user_applied_to_client("userId")
    or public.auth_client_has_student_applicant("userId")
  );

-- =============================================================================
-- REQUIREMENTS
-- =============================================================================
drop policy if exists "req_select_participants" on public.requirements;
create policy "req_select_participants"
  on public.requirements
  for select
  to authenticated
  using (
    "clientId" = auth.uid()
    or status = 'open'::"RequirementStatus"
    or public.auth_user_applied_to_requirement(id)
  );

-- =============================================================================
-- REQUIREMENT_SKILLS
-- =============================================================================
drop policy if exists "req_skills_select_owner" on public.requirement_skills;
create policy "req_skills_select_owner"
  on public.requirement_skills
  for select
  to authenticated
  using (
    public.auth_user_owns_requirement("requirementId")
    or public.requirement_is_open("requirementId")
    or public.auth_user_applied_to_requirement("requirementId")
  );

drop policy if exists "req_skills_insert_owner" on public.requirement_skills;
create policy "req_skills_insert_owner"
  on public.requirement_skills
  for insert
  to authenticated
  with check (public.auth_user_owns_requirement("requirementId"));

drop policy if exists "req_skills_update_owner" on public.requirement_skills;
create policy "req_skills_update_owner"
  on public.requirement_skills
  for update
  to authenticated
  using (public.auth_user_owns_requirement("requirementId"))
  with check (public.auth_user_owns_requirement("requirementId"));

drop policy if exists "req_skills_delete_owner" on public.requirement_skills;
create policy "req_skills_delete_owner"
  on public.requirement_skills
  for delete
  to authenticated
  using (public.auth_user_owns_requirement("requirementId"));

-- =============================================================================
-- APPLICATIONS
-- =============================================================================
drop policy if exists "apps_select_participants" on public.applications;
create policy "apps_select_participants"
  on public.applications
  for select
  to authenticated
  using (
    "studentId" = auth.uid()
    or public.auth_user_owns_requirement("requirementId")
  );

-- =============================================================================
-- MESSAGES
-- =============================================================================
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages
  for select
  to authenticated
  using (public.auth_user_is_requirement_participant("requirementId"));

drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants"
  on public.messages
  for insert
  to authenticated
  with check (
    "senderId" = auth.uid()
    and public.auth_user_is_requirement_participant("requirementId")
  );
