-- Track inbox reads per support ticket so opening the inbox alone never clears unread replies.
create table if not exists public.member_inbox_ticket_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, ticket_id)
);

alter table public.member_inbox_ticket_reads enable row level security;
revoke all on table public.member_inbox_ticket_reads from public, anon, authenticated;

create or replace function public.member_inbox_list()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_unread_count integer;
  v_items jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select count(*)::integer into v_unread_count
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
    and team.latest_team_at > coalesce(r.last_read_at, 'epoch'::timestamptz);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', inbox.id,
    'ticket_id', inbox.ticket_id,
    'subject', inbox.subject,
    'body', inbox.body,
    'created_at', inbox.created_at
  ) order by inbox.created_at desc), '[]'::jsonb)
  into v_items
  from (
    select m.id, m.ticket_id, t.subject, m.body, m.created_at
    from public.support_messages m
    join public.support_tickets t on t.id = m.ticket_id
    where t.user_id = v_user_id
      and m.sender_role <> 'member'::public.support_sender_role
    order by m.created_at desc
    limit 30
  ) inbox;

  return jsonb_build_object('unread_count', v_unread_count, 'items', v_items);
end;
$$;

create or replace function public.member_inbox_mark_ticket_read(p_ticket_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_read_at timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.support_tickets t
    where t.id = p_ticket_id and t.user_id = v_user_id
  ) then
    raise exception 'Support ticket not found' using errcode = '42501';
  end if;

  insert into public.member_inbox_ticket_reads(user_id, ticket_id, last_read_at, updated_at)
  values (v_user_id, p_ticket_id, v_read_at, v_read_at)
  on conflict (user_id, ticket_id) do update
    set last_read_at = excluded.last_read_at,
        updated_at = excluded.updated_at;
  return v_read_at;
end;
$$;

revoke all on function public.member_inbox_list() from public, anon;
revoke all on function public.member_inbox_mark_ticket_read(uuid) from public, anon;
grant execute on function public.member_inbox_list() to authenticated;
grant execute on function public.member_inbox_mark_ticket_read(uuid) to authenticated;
