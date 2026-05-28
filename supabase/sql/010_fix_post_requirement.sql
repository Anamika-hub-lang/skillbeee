-- Fix "row-level security policy for table requirements" when clients post tasks.

create or replace function public.auth_user_is_client()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'client'::"UserRole"
  );
$$;

drop policy if exists "req_insert_client" on public.requirements;
create policy "req_insert_client"
  on public.requirements
  for insert
  to authenticated
  with check (
    "clientId" = auth.uid()
    and public.auth_user_is_client()
  );

create or replace function public.create_client_requirement(
  p_title text,
  p_description text,
  p_budget integer,
  p_currency text,
  p_deadline_hours integer,
  p_urgent boolean,
  p_category text,
  p_skills text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  req_id uuid;
  skill text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  perform public.ensure_user_role('client'::"UserRole", true);

  if not public.auth_user_is_client() then
    raise exception 'Only client accounts can post tasks';
  end if;

  req_id := gen_random_uuid();

  insert into public.requirements (
    id,
    "clientId",
    title,
    description,
    budget,
    currency,
    "deadlineHours",
    urgent,
    category,
    status,
    "createdAt",
    "updatedAt"
  )
  values (
    req_id,
    uid,
    p_title,
    p_description,
    p_budget,
    p_currency,
    p_deadline_hours,
    p_urgent,
    p_category::"RequirementCategory",
    'open'::"RequirementStatus",
    now(),
    now()
  )
  returning id into req_id;

  foreach skill in array coalesce(p_skills, array[]::text[])
  loop
    insert into public.requirement_skills ("requirementId", name)
    values (req_id, skill)
    on conflict do nothing;
  end loop;

  return req_id;
end;
$$;

grant execute on function public.auth_user_is_client() to authenticated;
grant execute on function public.create_client_requirement(
  text, text, integer, text, integer, boolean, text, text[]
) to authenticated;
