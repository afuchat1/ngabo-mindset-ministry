drop policy if exists "Approved members can view active network groups" on public.network_groups;
create policy "Approved members and staff view active network groups"
on public.network_groups for select to authenticated
using (
  is_active = true and (
    exists (select 1 from public.member_profiles p where p.user_id = (select auth.uid()) and p.email_verified_at is not null and p.approval_status = 'approved'::public.member_approval_state)
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'support'::public.app_role)
  )
);

drop policy if exists "Members read messages in joined groups" on public.network_group_messages;
create policy "Members and staff read network group messages"
on public.network_group_messages for select to authenticated
using (
  exists (select 1 from public.network_group_members m where m.group_id = network_group_messages.group_id and m.user_id = (select auth.uid()))
  or public.has_role((select auth.uid()), 'admin'::public.app_role)
  or public.has_role((select auth.uid()), 'support'::public.app_role)
);

drop policy if exists "Members send messages in joined groups" on public.network_group_messages;
create policy "Members and staff send network group messages"
on public.network_group_messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (
    exists (select 1 from public.network_group_members m where m.group_id = network_group_messages.group_id and m.user_id = (select auth.uid()))
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'support'::public.app_role)
  )
  and (
    exists (select 1 from public.member_profiles p where p.user_id = (select auth.uid()) and p.email_verified_at is not null and p.approval_status = 'approved'::public.member_approval_state)
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'support'::public.app_role)
  )
);