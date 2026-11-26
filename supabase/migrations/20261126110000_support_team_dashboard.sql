-- Dedicated support-team dashboard data and reply operations.
create or replace function public.support_team_list_tickets()
returns jsonb language plpgsql security definer set search_path = public
as $$
declare result jsonb;
begin
  if auth.uid() is null or not (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  ) then raise exception 'Support team access required' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'ticket_number', t.ticket_number, 'subject', t.subject,
    'status', t.status, 'user_id', t.user_id, 'created_at', t.created_at,
    'updated_at', t.updated_at,
    'member', jsonb_build_object('user_id', p.user_id, 'first_name', p.first_name,
                                 'last_name', p.last_name, 'email', p.email),
    'messages', coalesce((select jsonb_agg(jsonb_build_object(
      'id', m.id, 'sender_role', m.sender_role, 'body', m.body, 'created_at', m.created_at
    ) order by m.created_at asc) from public.support_messages m where m.ticket_id = t.id), '[]'::jsonb)
  ) order by t.updated_at desc), '[]'::jsonb)
  into result from public.support_tickets t
  join public.member_profiles p on p.user_id = t.user_id;
  return result;
end;
$$;

create or replace function public.support_team_reply_to_ticket(
  p_ticket_id uuid, p_message text, p_resolve boolean default false
)
returns uuid language plpgsql security definer set search_path = public
as $$
declare message_id uuid;
begin
  if auth.uid() is null or not (
    public.has_role(auth.uid(), 'support'::public.app_role)
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  ) then raise exception 'Support team access required' using errcode = '42501'; end if;
  if p_message is null or char_length(trim(p_message)) < 1 or char_length(trim(p_message)) > 5000
    then raise exception 'Reply must contain between 1 and 5000 characters'; end if;
  update public.support_tickets
  set status = case when coalesce(p_resolve, false)
    then 'resolved'::public.support_ticket_state
    else 'awaiting_member'::public.support_ticket_state end,
    updated_at = now()
  where id = p_ticket_id;
  if not found then raise exception 'Ticket not found'; end if;
  insert into public.support_messages(ticket_id, sender_id, sender_role, body)
  values (p_ticket_id, auth.uid(), 'support'::public.support_sender_role, trim(p_message))
  returning id into message_id;
  return message_id;
end;
$$;
revoke all on function public.support_team_list_tickets() from public, anon;
revoke all on function public.support_team_reply_to_ticket(uuid, text, boolean) from public, anon;
grant execute on function public.support_team_list_tickets() to authenticated;
grant execute on function public.support_team_reply_to_ticket(uuid, text, boolean) to authenticated;
