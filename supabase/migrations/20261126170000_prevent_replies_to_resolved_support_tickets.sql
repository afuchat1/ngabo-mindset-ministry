-- A resolved support ticket is permanently closed to further messages.
-- Enforce this in the database so UI or RPC changes cannot reopen a closed conversation.

create or replace function public.prevent_message_on_resolved_support_ticket()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  ticket_status public.support_ticket_state;
begin
  select status into ticket_status
  from public.support_tickets
  where id = new.ticket_id;

  if not found then
    raise exception 'Support ticket not found' using errcode = '23503';
  end if;

  if ticket_status = 'resolved'::public.support_ticket_state then
    raise exception 'This support ticket is closed. Open a new request for further help.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

drop trigger if exists support_messages_reject_resolved_ticket on public.support_messages;
create trigger support_messages_reject_resolved_ticket
before insert on public.support_messages
for each row execute function public.prevent_message_on_resolved_support_ticket();

create or replace function public.support_team_reply_to_ticket(
  p_ticket_id uuid, p_message text, p_resolve boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  message_id uuid;
  ticket_status public.support_ticket_state;
begin
  if auth.uid() is null or not (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  ) then
    raise exception 'Support team access required' using errcode = '42501';
  end if;

  if p_message is null or char_length(trim(p_message)) < 1 or char_length(trim(p_message)) > 5000 then
    raise exception 'Reply must contain between 1 and 5000 characters';
  end if;

  select status into ticket_status
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then raise exception 'Ticket not found'; end if;
  if ticket_status = 'resolved'::public.support_ticket_state then
    raise exception 'This support ticket is closed. Open a new request for further help.';
  end if;

  -- Insert while the ticket is still active; the trigger rejects inserts after closure.
  insert into public.support_messages(ticket_id, sender_id, sender_role, body)
  values (p_ticket_id, auth.uid(), 'support'::public.support_sender_role, trim(p_message))
  returning id into message_id;

  update public.support_tickets
  set status = case when coalesce(p_resolve, false)
                    then 'resolved'::public.support_ticket_state
                    else 'awaiting_member'::public.support_ticket_state end,
      updated_at = now()
  where id = p_ticket_id;

  return message_id;
end;
$$;

create or replace function public.admin_reply_to_support_ticket(
  p_ticket_id uuid, p_message text, p_resolve boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  message_id uuid;
  ticket_status public.support_ticket_state;
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'Admin required' using errcode = '42501';
  end if;

  if p_message is null or char_length(trim(p_message)) < 1 or char_length(trim(p_message)) > 5000 then
    raise exception 'Reply must contain between 1 and 5000 characters';
  end if;

  select status into ticket_status
  from public.support_tickets
  where id = p_ticket_id
  for update;

  if not found then raise exception 'Ticket not found'; end if;
  if ticket_status = 'resolved'::public.support_ticket_state then
    raise exception 'This support ticket is closed. Open a new request for further help.';
  end if;

  insert into public.support_messages(ticket_id, sender_id, sender_role, body)
  values (p_ticket_id, auth.uid(), 'admin', trim(p_message))
  returning id into message_id;

  update public.support_tickets
  set status = case when coalesce(p_resolve, false)
                    then 'resolved'::public.support_ticket_state
                    else 'awaiting_member'::public.support_ticket_state end,
      updated_at = now()
  where id = p_ticket_id;

  return message_id;
end;
$$;

revoke all on function public.prevent_message_on_resolved_support_ticket() from public, anon, authenticated;
revoke all on function public.support_team_reply_to_ticket(uuid, text, boolean) from public, anon;
revoke all on function public.admin_reply_to_support_ticket(uuid, text, boolean) from public, anon;
grant execute on function public.support_team_reply_to_ticket(uuid, text, boolean) to authenticated;
grant execute on function public.admin_reply_to_support_ticket(uuid, text, boolean) to authenticated;
