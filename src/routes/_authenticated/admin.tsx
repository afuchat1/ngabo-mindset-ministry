import { createFileRoute, Outlet, Navigate, redirect, useRouterState } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { SupportTeamDashboard } from '@/components/member-platform/support-team-dashboard';

export const Route = createFileRoute('/_authenticated/admin')({ head: () => ({ meta: [{ title: 'Administration | NGABO (MMA)' }, { name: 'description', content: 'Manage NGABO ministry operations, members, learning and content.' }, { property: 'og:title', content: 'Events & announcements | NGABO (MMA)' }, { property: 'og:description', content: 'Manage ministry operations, members, learning and content.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex' }] }), beforeLoad: async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: '/auth' });
  const [admin, support] = await Promise.all([
    supabase.rpc('has_role', { _user_id: data.user.id, _role: 'admin' }),
    supabase.rpc('has_role', { _user_id: data.user.id, _role: 'support' }),
  ]);
  if (admin.error || support.error || (!admin.data && !support.data)) throw redirect({ to: '/auth' });
  return { appRole: admin.data ? 'admin' as const : 'support' as const };
}, component: AdminPage });

function AdminPage() {
  const { appRole } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (appRole === "support") return <SupportTeamDashboard />;
  return pathname === "/admin" ? <Navigate to="/admin/overview" /> : <Outlet />;
}

