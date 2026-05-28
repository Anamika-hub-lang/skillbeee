-- SkillBee: fix client task posting (RLS on requirements INSERT).
-- Run in Supabase SQL Editor after 004 / 005.
--
-- Root cause: req_insert_client requires public.users.role = 'client', but new auth
-- users default to 'student' via handle_new_user(). The app now syncs role before post;
-- this function makes the RLS role check reliable (SECURITY DEFINER bypasses users RLS).

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

grant execute on function public.auth_user_is_client() to authenticated;

drop policy if exists "req_insert_client" on public.requirements;
create policy "req_insert_client"
  on public.requirements
  for insert
  to authenticated
  with check (
    "clientId" = auth.uid()
    and public.auth_user_is_client()
  );
