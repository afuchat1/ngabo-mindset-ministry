import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleHelp, Images, LayoutDashboard, LogOut, Network, Package, UsersRound, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/ngabo-logo.jpg";
import { AdminLearningSection } from "@/components/member-platform/admin-learning-section";
import "@/components/member-platform/workspace.css";
import { supabase } from "@/integrations/supabase/client";

type AdminSection = "members" | "support" | "courses" | "quizzes" | "network" | "events" | "products" | "photos";
const items: Array<{ id: AdminSection; label: string; icon: typeof LayoutDashboard; href: string }> = [
  { id: "members", label: "Members", icon: UsersRound, href: "/admin/members" },
  { id: "support", label: "Support", icon: LifeBuoy, href: "/admin/support" },
  { id: "courses", label: "Courses", icon: BookOpen, href: "/admin/courses" },
  { id: "quizzes", label: "Quizzes", icon: CircleHelp, href: "/admin/quizzes" },
  { id: "network", label: "Network", icon: Network, href: "/admin/network" },
  { id: "events", label: "Events", icon: CalendarDays, href: "/admin/events" },
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
      <Link to="/" className="ng-admin-brand" aria-label="NGABO home"><img src={logoImage} alt="" /><span><strong>NGABO</strong><small>Administration</small></span></Link>
      <p className="ng-admin-nav-label">WORKSPACE</p>
      <nav aria-label="Administration navigation" className="ng-admin-nav">
        <Link to="/admin" className="ng-admin-nav-link"><LayoutDashboard size={17}/>Overview</Link>
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
        <Link to="/admin">Overview</Link>
        {items.map(({id,label,href})=><Link key={id} to={href as any} aria-current={section===id?"page":undefined}>{label}</Link>)}
      </nav>
      <div className="ng-admin-page-content"><AdminLearningSection initialSection={section === "events" || section === "products" || section === "photos" ? "members" : section} fixedSection={section === "events" || section === "products" || section === "photos" ? undefined : section}/></div>
    </div>
  </main>;
}
