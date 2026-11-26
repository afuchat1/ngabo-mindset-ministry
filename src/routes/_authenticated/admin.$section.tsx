import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSectionPage } from "@/components/member-platform/admin-section-page";
import { supabase } from "@/integrations/supabase/client";

const sections = ["overview", "members", "support", "courses", "quizzes", "network", "products", "photos"] as const;
type Section = (typeof sections)[number];

export const Route = createFileRoute("/_authenticated/admin/$section")({
  beforeLoad: async ({ params }) => {
    const section = params.section as Section;
    if (!sections.includes(section)) throw redirect({ to: "/admin" });
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw redirect({ to: "/auth" });
    const { data, error: roleError } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (roleError || !data) throw redirect({ to: "/admin" });
    return { adminSection: section };
  },
  component: AdminSectionRoute,
});

function AdminSectionRoute() {
  const { adminSection } = Route.useRouteContext();
  return <AdminSectionPage section={adminSection} />;
}
