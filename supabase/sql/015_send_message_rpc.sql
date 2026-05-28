-- Fix "null value in column id" when sending chat messages.

alter table public.messages
  alter column id set default gen_random_uuid();

create or replace function public.send_thread_message(
  p_requirement_id uuid,
  p_body text,
  p_attachment_uri text default null,
  p_is_voice boolean default false
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  msg public.messages;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if trim(coalesce(p_body, '')) = '' then
    raise exception 'Message cannot be empty';
  end if;

  if not public.auth_user_is_requirement_participant(p_requirement_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.messages (
    id,
    "requirementId",
    "senderId",
    body,
    "attachmentUri",
    "isVoice",
    "createdAt"
  )
  values (
    gen_random_uuid(),
    p_requirement_id,
    uid,
    trim(p_body),
    p_attachment_uri,
    coalesce(p_is_voice, false),
    now()
  )
  returning * into msg;

  return json_build_object(
    'id', msg.id,
    'requirementId', msg."requirementId",
    'senderId', msg."senderId",
    'body', msg.body,
    'attachmentUri', msg."attachmentUri",
    'isVoice', msg."isVoice",
    'readAt', msg."readAt",
    'createdAt', msg."createdAt"
  );
end;
$$;

grant execute on function public.send_thread_message(uuid, text, text, boolean) to authenticated;

notify pgrst, 'reload schema';
