-- Client accepts one student application (creates project, rejects other pending apps).
-- Run once in Supabase → SQL Editor if Accept shows:
--   "could not find the function public.accept_application(p_application_id) in the schema cache"

alter table public.projects
  alter column id set default gen_random_uuid();

alter table public.projects
  alter column "updatedAt" set default now();

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
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select a."requirementId", r."clientId", a."studentId"
  into v_req_id, v_client_id, v_student_id
  from public.applications a
  join public.requirements r on r.id = a."requirementId"
  where a.id = p_application_id;

  if v_req_id is null then
    raise exception 'Application not found';
  end if;

  if v_client_id is null or v_client_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.applications
  set status = 'rejected'::"ApplicationStatus", "updatedAt" = now()
  where "requirementId" = v_req_id
    and id <> p_application_id
    and status = 'pending'::"ApplicationStatus";

  update public.applications
  set status = 'accepted'::"ApplicationStatus", "updatedAt" = now()
  where id = p_application_id;

  update public.requirements
  set
    status = 'matched'::"RequirementStatus",
    "currentStep" = 'accepted'::"TaskStep",
    "updatedAt" = now()
  where id = v_req_id;

  if exists (select 1 from public.projects where "requirementId" = v_req_id) then
    return;
  end if;

  insert into public.projects (
    id,
    "requirementId",
    "applicationId",
    "clientId",
    "studentId",
    status,
    "createdAt",
    "updatedAt"
  )
  values (
    gen_random_uuid(),
    v_req_id,
    p_application_id,
    v_client_id,
    v_student_id,
    'active'::"ProjectStatus",
    now(),
    now()
  );
end;
$$;

grant execute on function public.accept_application(uuid) to authenticated;

notify pgrst, 'reload schema';
