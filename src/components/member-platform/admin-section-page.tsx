import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleHelp, Images, LayoutDashboard, LogOut, Network, Package, UsersRound, LifeBuoy, ClipboardList, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/ngabo-logo.jpg";
import { AdminLearningSection } from "@/components/member-platform/admin-learning-section";
import { AdminProducts } from "@/components/admin-products";
import { AdminHeroImages } from "@/components/admin-hero-images";
import "@/components/member-platform/workspace.css";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPlatformData } from "@/components/member-platform/use-platform";
import { AdminEventsPage } from "@/components/member-platform/admin-events-page";

type AdminSection = "overview" | "events" | "members" | "support" | "courses" | "quizzes" | "network" | "products" | "photos";
const items: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard; href: string }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin/overview" },
  { id: "events", label: "Events", icon: CalendarDays, href: "/admin/events" },
  { id: "members", label: "Members", icon: UsersRound, href: "/admin/members" },
  { id: "support", label: "Support", icon: LifeBuoy, href: "/admin/support" },
  { id: "courses", label: "Courses", icon: BookOpen, href: "/admin/courses" },
  { id: "quizzes", label: "Quizzes", icon: CircleHelp, href: "/admin/quizzes" },
  { id: "network", label: "Network", icon: Network, href: "/admin/network" },
  { id: "products", label: "Products", icon: Package, href: "/admin/products" },
  { id: "photos", label: "Homepage photos", icon: Images, href: "/admin/photos" },
];

export function AdminSectionPage({ section }: { section: AdminSection }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  const current = items.find((item) => item.id === section)!;
  return <main className="ng-admin-app">
    <aside className="ng-admin-sidebar">
      <Link to="/admin/overview" className="ng-admin-brand" aria-label="NGABO administration overview"><img src={logoImage} alt="" /><span><strong>NGABO</strong><small>Administration</small></span></Link>
      <p className="ng-admin-nav-label">WORKSPACE</p>
      <nav aria-label="Administration navigation" className="ng-admin-nav">
        
        {items.map(({id,label,icon:Icon,href})=><Link key={id} to={href as any} aria-current={section===id?"page":undefined} className="ng-admin-nav-link"><Icon size={17}/><span>{label}</span></Link>)}
      </nav>
      <div className="ng-admin-sidebar-bottom"><Link to="/" className="ng-admin-nav-link"><ArrowUpRight size={17}/>View website</Link><button type="button" className="ng-admin-nav-link" onClick={() => void signOut()}><LogOut size={17}/>Sign out</button></div>
    </aside>
    <div className="ng-admin-main">
      <header className="ng-admin-topbar">
        <div><p className="ng-admin-eyebrow">ADMINISTRATION / {current.label.toUpperCase()}</p><h1>{current.label}</h1></div>
        <div className="ng-admin-top-actions"><span className="ng-admin-live"><Activity size={14}/> Workspace</span><Button variant="outline" size="sm" onClick={() => void signOut()}><LogOut size={15}/>Sign out</Button></div>
      </header>
      <nav className="ng-admin-mobile-nav" aria-label="Administration pages">
        
        {items.map(({id,label,href})=><Link key={id} to={href as any} aria-current={section===id?"page":undefined}>{label}</Link>)}
      </nav>
      <div className="ng-admin-page-content">{section === "overview" ? <AdminOverview/> : section === "events" ? <AdminEventsPage/> : section === "products" ? <><AdminProducts placement="top"/><AdminProducts placement="bottom"/></> : section === "photos" ? <AdminHeroImages/> : <AdminLearningSection initialSection={section} fixedSection={section}/>}</div>
    </div>
  </main>;
}


function AdminOverview() {
  const query = useAdminPlatformData();
  const data = query.data as { counts?: { members: number; pendingApprovals: number; openTickets: number; activeCourses: number; activeQuizzes: number } } | undefined;
  const stats = [
    { label: "Registered members", value: data?.counts?.members ?? 0, icon: UsersRound, href: "/admin/members" },
    { label: "Awaiting review", value: data?.counts?.pendingApprovals ?? 0, icon: ClipboardList, href: "/admin/members" },
    { label: "Open support", value: data?.counts?.openTickets ?? 0, icon: MessageCircle, href: "/admin/support" },
    { label: "Active courses", value: data?.counts?.activeCourses ?? 0, icon: BookOpen, href: "/admin/courses" },
    { label: "Active quizzes", value: data?.counts?.activeQuizzes ?? 0, icon: CircleHelp, href: "/admin/quizzes" },
  ];
  return <section className="ng-admin-overview">
    <div className="ng-admin-overview-heading"><div><p className="ng-admin-eyebrow">MINISTRY OPERATIONS</p><h2>Workspace overview</h2><p>Monitor key activity and move directly into each administration area.</p></div><span className="ng-admin-refresh-note">{query.isFetching ? "Updating…" : "Live workspace data"}</span></div>
    {query.isError ? <p role="alert" className="py-8 text-sm text-destructive">Could not load administration metrics. Open a section to continue.</p> : <div className="ng-admin-metrics">{stats.map(({label,value,icon:Icon,href})=><Link key={label} to={href as any} className="ng-admin-metric"><span className="ng-admin-metric-label">{label}<Icon size={17}/></span><strong>{query.isPending ? "—" : value}</strong><span className="ng-admin-metric-link">Open section <ArrowUpRight size={13}/></span></Link>)}</div>}
    <div className="ng-admin-quick-grid">{items.filter(item=>item.id!=="overview").map(({id,label,icon:Icon,href})=><Link key={id} to={href as any} className="ng-admin-quick-link"><span><Icon size={19}/></span><strong>{label}</strong><ArrowUpRight size={15}/></Link>)}</div>
  </section>;
}
