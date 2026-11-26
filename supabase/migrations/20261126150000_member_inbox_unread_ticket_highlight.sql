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

  with unread as (
    select t.id as ticket_id
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
      and team.latest_team_at > coalesce(member.latest_member_at, 'epoch'::timestamptz)
      and team.latest_team_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
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
    'is_unread', inbox.is_unread
  ) order by inbox.created_at desc), '[]'::jsonb)
  into v_items
  from (
    select
      m.id,
      m.ticket_id,
      t.subject,
      m.body,
      m.created_at,
      (
        m.created_at = team.latest_team_at
        and team.latest_team_at > coalesce(member.latest_member_at, 'epoch'::timestamptz)
        and team.latest_team_at > coalesce(r.last_read_at, 'epoch'::timestamptz)
      ) as is_unread
    from public.support_messages m
    join public.support_tickets t on t.id = m.ticket_id
    join lateral (
      select max(tm.created_at) as latest_team_at
      from public.support_messages tm
      where tm.ticket_id = t.id
        and tm.sender_role <> 'member'::public.support_sender_role
    ) team on team.latest_team_at is not null
    left join lateral (
      select max(mm.created_at) as latest_member_at
      from public.support_messages mm
      where mm.ticket_id = t.id
        and mm.sender_role = 'member'::public.support_sender_role
    ) member on true
    left join public.member_inbox_ticket_reads r
      on r.user_id = v_user_id and r.ticket_id = t.id
    where t.user_id = v_user_id
      and m.sender_role <> 'member'::public.support_sender_role
    order by m.created_at desc
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