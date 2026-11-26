-- Keep the member inbox limited to active tickets with an unread team reply.
-- Opening a ticket marks that ticket read; replying as the member supersedes the
-- team's last reply; resolved tickets are removed from the inbox entirely.
create or replace function public.member_inbox_list()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unread_count integer;
  v_unread_ticket_ids jsonb;
  v_items jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  with ticket_activity as (
    select
      t.id as ticket_id,
      team.latest_team_at,
      member.latest_member_at,
      coalesce(r.last_read_at, 'epoch'::timestamptz) as last_read_at
    from public.support_tickets t
    join lateral (
      select max(m.created_at) as latest_team_at
      from public.support_messages m
      where m.ticket_id = t.id
        and m.sender_role <> 'member'::public.support_sender_role
    ) team on team.latest_team_at is not null
    left join lateral (
      select max(m.created_at) as latest_member_at
      from public.support_messages m
      where m.ticket_id = t.id
        and m.sender_role = 'member'::public.support_sender_role
    ) member on true
    left join public.member_inbox_ticket_reads r
      on r.user_id = v_user_id and r.ticket_id = t.id
    where t.user_id = v_user_id
      and t.status <> 'resolved'::public.support_ticket_state
  ),
  unread as (
    select ticket_id, latest_team_at
    from ticket_activity
    where latest_team_at > coalesce(latest_member_at, 'epoch'::timestamptz)
      and latest_team_at > last_read_at
  )
  select count(*)::integer, coalesce(jsonb_agg(ticket_id), '[]'::jsonb)
    into v_unread_count, v_unread_ticket_ids
  from unread;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', inbox.id,
    'ticket_id', inbox.ticket_id,
    'subject', inbox.subject,
    'body', inbox.body,
    'created_at', inbox.created_at,
    'is_unread', true
  ) order by inbox.created_at desc), '[]'::jsonb)
    into v_items
  from (
    select
      latest_message.id,
      t.id as ticket_id,
      t.subject,
      latest_message.body,
      latest_message.created_at
    from public.support_tickets t
    join lateral (
      select m.id, m.body, m.created_at
      from public.support_messages m
      where m.ticket_id = t.id
        and m.sender_role <> 'member'::public.support_sender_role
      order by m.created_at desc
      limit 1
    ) latest_message on true
    join lateral (
      select max(m.created_at) as latest_team_at
      from public.support_messages m
      where m.ticket_id = t.id
        and m.sender_role <> 'member'::public.support_sender_role
    ) team on true
    left join lateral (
      select max(m.created_at) as latest_member_at
      from public.support_messages m
      where m.ticket_id = t.id
        and m.sender_role = 'member'::public.support_sender_role
    ) member on true
    left join public.member_inbox_ticket_reads r
      on r.user_id = v_user_id and r.ticket_id = t.id
    where t.user_id = v_user_id
      and t.status <> 'resolved'::public.support_ticket_state
      and latest_message.created_at = team.latest_team_at
      and team.latest_team_at > coalesce(member.latest_member_at, 'epoch'::timestamptz)
      and team.latest_team_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
    order by latest_message.created_at desc
    limit 30
  ) inbox;

  return jsonb_build_object(
    'unread_count', v_unread_count,
    'unread_ticket_ids', v_unread_ticket_ids,
    'items', v_items
  );
end;
$$;

revoke all on function public.member_inbox_list() from public, anon;
grant execute on function public.member_inbox_list() to authenticated;
