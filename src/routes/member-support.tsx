import { createFileRoute, redirect } from '@tanstack/react-router';
import { MemberSupport } from '@/components/member-platform';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/member-support')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/auth' });

    const role = await supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
    if (role.error) throw new Error('Could not verify account permissions. Please try again.');
    if (role.data) throw redirect({ to: '/admin' });

    const profile = await supabase
      .from('member_profiles')
      .select('approval_status')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (profile.error) throw new Error('Could not verify your member status. Please try again.');
    if (profile.data?.approval_status === 'approved') {
      throw redirect({ to: '/dashboard/support' });
    }
  },
  component: PendingMemberSupportPage,
});

function PendingMemberSupportPage() {
  return <MemberSupport pendingAccess />;
}
