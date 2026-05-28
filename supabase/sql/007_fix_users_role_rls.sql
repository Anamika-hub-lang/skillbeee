-- Fix: "new row violates row-level security policy for table users" on role pick.
-- Run after 004/005. Adds a SECURITY DEFINER helper the app calls when saving client/student role.

-- Backfill any auth users missing a public.users row (e.g. trigger was added after signup).
insert into public.users (id, email, role, "createdAt", "updatedAt")
select u.id, coalesce(u.email, ''), 'student'::"UserRole", now(), now()
from auth.users u
where not exists (select 1 from public.users pu where pu.id = u.id)
on conflict (id) do nothing;

insert into public.profiles ("userId", "createdAt", "updatedAt")
select u.id, now(), now()
from auth.users u
where not exists (select 1 from public.profiles p where p."userId" = u.id)
on conflict ("userId") do nothing;

create or replace function public.ensure_user_role(p_role "UserRole" default 'student'::"UserRole")
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
    set role = excluded.role,
        email = coalesce(excluded.email, public.users.email),
        "updatedAt" = now();

  insert into public.profiles ("userId", "createdAt", "updatedAt")
  values (uid, now(), now())
  on conflict ("userId") do update
    set "updatedAt" = now();
end;
$$;

grant execute on function public.ensure_user_role("UserRole") to authenticated;
