-- Student apply with work samples (fixes missing id / sampleUrls on direct insert).

alter table public.applications
  alter column id set default gen_random_uuid();

alter table public.applications
  alter column "updatedAt" set default now();

create or replace function public.submit_student_application(
  p_requirement_id uuid,
  p_cover_note text default null,
  p_sample_urls text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  req record;
  app_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_sample_urls is null or coalesce(array_length(p_sample_urls, 1), 0) < 1 then
    raise exception 'Add at least one work sample';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = uid
      and u.role = 'student'::"UserRole"
  ) then
    raise exception 'Only student accounts can apply';
  end if;

  select id, "clientId", status
  into req
  from public.requirements
  where id = p_requirement_id;

  if req.id is null then
    raise exception 'Requirement not found';
  end if;

  if req.status <> 'open'::"RequirementStatus" then
    raise exception 'Requirement is not open for applications';
  end if;

  if req."clientId" = uid then
    raise exception 'You cannot apply to your own requirement';
  end if;

  insert into public.applications (
    id,
    "requirementId",
    "studentId",
    status,
    "coverNote",
    "sampleUrls",
    "createdAt",
    "updatedAt"
  )
  values (
    gen_random_uuid(),
    p_requirement_id,
    uid,
    'pending'::"ApplicationStatus",
    p_cover_note,
    coalesce(p_sample_urls, array[]::text[]),
    now(),
    now()
  )
  on conflict ("requirementId", "studentId") do update
  set
    "coverNote" = excluded."coverNote",
    "sampleUrls" = excluded."sampleUrls",
    status = 'pending'::"ApplicationStatus",
    "updatedAt" = now()
  returning id into app_id;

  return app_id;
end;
$$;

grant execute on function public.submit_student_application(uuid, text, text[]) to authenticated;

notify pgrst, 'reload schema';
