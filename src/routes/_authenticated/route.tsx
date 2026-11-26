import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated')({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: '/auth' });
    const [admin, support] = await Promise.all([
      supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' }),
      supabase.rpc('has_role', { _user_id: data.user.id, _role: 'support' }),
    ]);
    if (admin.error || support.error || (!admin.data && !support.data)) {
      throw redirect({ to: '/auth' });
    }
  },
  component: Outlet,
});
