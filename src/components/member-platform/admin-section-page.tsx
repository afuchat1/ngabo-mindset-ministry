import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleHelp, Images, LayoutDashboard, Network, Package, UsersRound, LifeBuoy, ClipboardList, MessageCircle, Menu, X, UserRound, ShieldCheck, Mail, Phone, MapPin, CalendarClock, BadgeCheck, LogOut, Compass, Inbox, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/ngabo-logo.jpg";
import { AdminLearningSection } from "@/components/member-platform/admin-learning-section";
import { AdminProducts } from "@/components/admin-products";
import { AdminHeroImages } from "@/components/admin-hero-images";
import "@/components/member-platform/workspace.css";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPlatformData } from "@/components/member-platform/use-platform";
import { AdminEventsPage } from "@/components/member-platform/admin-events-page";
import { getMemberInbox } from "@/lib/member-platform.functions";

type AdminSection = "overview" | "events" | "members" | "support" | "courses" | "quizzes" | "network" | "products" | "photos" | "profile";
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
  { id: "profile", label: "My profile", icon: UserRound, href: "/admin/profile" },
];

export function AdminSectionPage({ section }: { section: AdminSection }) {
  return <main className="ng-admin-app">
    <div className="ng-admin-main">
      <AdminWorkspaceHeader active={section} />
      <div className="ng-admin-page-content">{section === "overview" ? <AdminOverview/> : section === "profile" ? <AdminProfile/> : section === "events" ? <AdminEventsPage/> : section === "products" ? <><AdminProducts placement="top"/><AdminProducts placement="bottom"/></> : section === "photos" ? <AdminHeroImages/> : <AdminLearningSection initialSection={section} fixedSection={section}/>}</div>
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
    <div className="ng-admin-quick-grid">{items.filter(item=>item.id!=="overview" && item.id!=="profile").map(({id,label,icon:Icon,href})=><Link key={id} to={href as any} className="ng-admin-quick-link"><span><Icon size={19}/></span><strong>{label}</strong><ArrowUpRight size={15}/></Link>)}</div>
  </section>;
}
