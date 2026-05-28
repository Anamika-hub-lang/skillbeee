-- Reliable profile save (direct table update/upsert from the app could silently affect 0 rows).

alter table public.profiles
  add column if not exists "setupComplete" boolean not null default false;

create or replace function public.save_my_profile(
  p_display_name text default null,
  p_photo_url text default null,
  p_skills text[] default null,
  p_hourly_rate double precision default null,
  p_availability_note text default null,
  p_available_now boolean default null,
  p_portfolio_url text default null,
  p_bio text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean_name text := nullif(trim(coalesce(p_display_name, '')), '');
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.users (id, email, role, "createdAt", "updatedAt")
  select uid, coalesce(au.email, ''), 'student'::"UserRole", now(), now()
  from auth.users au
  where au.id = uid
  on conflict (id) do nothing;

  insert into public.profiles (
    "userId",
    "displayName",
    "photoUrl",
    skills,
    "hourlyRate",
    "availabilityNote",
    "availableNow",
    "portfolioUrl",
    bio,
    "setupComplete",
    "createdAt",
    "updatedAt"
  )
  values (
    uid,
    clean_name,
    p_photo_url,
    coalesce(p_skills, array[]::text[]),
    coalesce(p_hourly_rate, 0),
    p_availability_note,
    coalesce(p_available_now, false),
    p_portfolio_url,
    p_bio,
    clean_name is not null,
    now(),
    now()
  )
  on conflict ("userId") do update
  set
    "displayName" = coalesce(clean_name, profiles."displayName"),
    "photoUrl" = coalesce(p_photo_url, profiles."photoUrl"),
    skills = case
      when p_skills is not null and coalesce(array_length(p_skills, 1), 0) > 0 then p_skills
      else profiles.skills
    end,
    "hourlyRate" = coalesce(p_hourly_rate, profiles."hourlyRate"),
    "availabilityNote" = coalesce(p_availability_note, profiles."availabilityNote"),
    "availableNow" = coalesce(p_available_now, profiles."availableNow"),
    "portfolioUrl" = coalesce(p_portfolio_url, profiles."portfolioUrl"),
    bio = coalesce(p_bio, profiles.bio),
    "setupComplete" = profiles."setupComplete"
      or clean_name is not null
      or (
        p_skills is not null
        and coalesce(array_length(p_skills, 1), 0) > 0
      ),
    "updatedAt" = now();
end;
$$;

grant execute on function public.save_my_profile(
  text,
  text,
  text[],
  double precision,
  text,
  boolean,
  text,
  text
) to authenticated;

-- Backfill: anyone who already saved a display name is marked complete.
update public.profiles
set "setupComplete" = true
where "setupComplete" = false
  and nullif(trim(coalesce("displayName", '')), '') is not null;
