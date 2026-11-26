-- Member inbox: unread in-app support replies, with per-member read state.
create table if not exists public.member_inbox_reads (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.member_inbox_reads enable row level security;
revoke all on table public.member_inbox_reads from anon, authenticated;
grant select, insert, update on table public.member_inbox_reads to authenticated;

drop policy if exists "Members manage their own inbox read state" on public.member_inbox_reads;
create policy "Members manage their own inbox read state"
on public.member_inbox_reads for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create or replace function public.member_inbox_list()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_last_read_at timestamptz;
  v_unread_count integer;
  v_items jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select r.last_read_at into v_last_read_at
  from public.member_inbox_reads r where r.user_id = v_user_id;
  v_last_read_at := coalesce(v_last_read_at, 'epoch'::timestamptz);

  select count(*)::integer into v_unread_count
  from public.support_messages m
  join public.support_tickets t on t.id = m.ticket_id
  where t.user_id = v_user_id
    and m.sender_role <> 'member'::public.support_sender_role
    and m.created_at > v_last_read_at;

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

create or replace function public.member_inbox_mark_read()
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

  insert into public.member_inbox_reads(user_id, last_read_at, updated_at)
  values (v_user_id, v_read_at, v_read_at)
  on conflict (user_id) do update
    set last_read_at = excluded.last_read_at,
        updated_at = excluded.updated_at;
  return v_read_at;
end;
$$;

revoke all on function public.member_inbox_list() from public, anon;
revoke all on function public.member_inbox_mark_read() from public, anon;
grant execute on function public.member_inbox_list() to authenticated;
grant execute on function public.member_inbox_mark_read() to authenticated;
