-- Remember one role per account + fix post-task client check (RLS-safe reads).
-- p_force=true only on first role pick; later calls never overwrite role.

create or replace function public.ensure_user_role(
  p_role "UserRole" default 'student'::"UserRole",
  p_force boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mail text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into mail from auth.users where id = uid;

  insert into public.users (id, email, role, "createdAt", "updatedAt")
  values (uid, coalesce(mail, ''), p_role, now(), now())
  on conflict (id) do update
    set role = case when p_force then excluded.role else public.users.role end,
        email = coalesce(excluded.email, public.users.email),
        "updatedAt" = now();

  insert into public.profiles ("userId", "createdAt", "updatedAt")
  values (uid, now(), now())
  on conflict ("userId") do update
    set "updatedAt" = now();
end;
$$;

create or replace function public.get_my_role()
returns "UserRole"
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

grant execute on function public.ensure_user_role("UserRole", boolean) to authenticated;
grant execute on function public.get_my_role() to authenticated;
