import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_member')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/auth' });

    const [admin, support] = await Promise.all([
      supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' }),
      supabase.rpc('has_role', { _user_id: data.user.id, _role: 'support' }),
    ]);
    if (admin.error || support.error) throw new Error('Could not verify account permissions. Please try again.');
    if (admin.data || support.data) throw redirect({ to: '/admin' });

    if (!data.user.email_confirmed_at) throw redirect({ to: '/pending-approval' });
    const profile = await supabase.from('member_profiles').select('approval_status,email_verified_at')
      .eq('user_id', data.user.id).maybeSingle();
    if (profile.error) throw new Error('Could not verify member access. Please try again.');
    if (profile.data?.approval_status !== 'approved' || !profile.data.email_verified_at) {
      throw redirect({ to: '/pending-approval' });
    }
  },
  component: Outlet,
});
