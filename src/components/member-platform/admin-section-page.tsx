import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, CircleHelp, Images, LayoutDashboard, Network, Package, UsersRound, LifeBuoy, ClipboardList, MessageCircle, Menu, X, UserRound, ShieldCheck, Mail, Phone, MapPin, CalendarClock, BadgeCheck, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/ngabo-logo.jpg";
import { AdminLearningSection } from "@/components/member-platform/admin-learning-section";
import { AdminProducts } from "@/components/admin-products";
import { AdminHeroImages } from "@/components/admin-hero-images";
import "@/components/member-platform/workspace.css";
import { supabase } from "@/integrations/supabase/client";
import { useAdminPlatformData } from "@/components/member-platform/use-platform";
import { AdminEventsPage } from "@/components/member-platform/admin-events-page";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const current = items.find((item) => item.id === section)!;
  return <main className="ng-admin-app">
    <aside className="ng-admin-sidebar">
      <Link to="/admin/overview" className="ng-admin-brand" aria-label="NGABO administration overview"><img src={logoImage} alt="" /><span><strong>NGABO</strong><small>Administration</small></span></Link>
      <p className="ng-admin-nav-label">WORKSPACE</p>
      <nav aria-label="Administration navigation" className="ng-admin-nav">
        
        {items.map(({id,label,icon:Icon,href})=><Link key={id} to={href as any} aria-current={section===id?"page":undefined} className="ng-admin-nav-link"><Icon size={17}/><span>{label}</span></Link>)}
      </nav>
      <div className="ng-admin-sidebar-bottom"><Link to="/" className="ng-admin-nav-link"><ArrowUpRight size={17}/>View website</Link></div>
    </aside>
    {mobileNavOpen && <button type="button" className="ng-admin-drawer-scrim" aria-label="Close administration navigation" onClick={() => setMobileNavOpen(false)} />}
    <aside className={`ng-admin-mobile-drawer${mobileNavOpen ? " is-open" : ""}`} aria-label="Mobile administration navigation" aria-hidden={!mobileNavOpen}>
      <div className="ng-admin-drawer-heading">
        <Link to="/admin/overview" className="ng-admin-brand" onClick={() => setMobileNavOpen(false)}><img src={logoImage} alt="" /><span><strong>NGABO</strong><small>Administration</small></span></Link>
        <button type="button" className="ng-admin-drawer-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={20}/></button>
      </div>
      <p className="ng-admin-nav-label">WORKSPACE</p>
      <nav aria-label="Administration pages" className="ng-admin-nav">
        {items.map(({id,label,icon:Icon,href})=><Link key={id} to={href as any} aria-current={section===id?"page":undefined} className="ng-admin-nav-link" onClick={() => setMobileNavOpen(false)}><Icon size={18}/><span>{label}</span></Link>)}
      </nav>
      <div className="ng-admin-sidebar-bottom"><Link to="/" className="ng-admin-nav-link" onClick={() => setMobileNavOpen(false)}><ArrowUpRight size={17}/>View website</Link></div>
    </aside>
    <div className="ng-admin-main">
      <header className="ng-admin-topbar">
        <button type="button" className="ng-admin-menu-trigger" aria-label="Open administration navigation" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen(true)}><Menu size={21}/></button>
        <div className="ng-admin-topbar-title"><p className="ng-admin-eyebrow">ADMINISTRATION / {current.label.toUpperCase()}</p><h1>{current.label}</h1></div>
        <div className="ng-admin-top-actions"><span className="ng-admin-live"><Activity size={14}/> Workspace</span><Button asChild variant="outline" size="sm"><Link to="/admin/profile"><UserCircle size={15}/>My profile</Link></Button></div>
      </header>
      <div className="ng-admin-page-content">{section === "overview" ? <AdminOverview/> : section === "profile" ? <AdminProfile/> : section === "events" ? <AdminEventsPage/> : section === "products" ? <><AdminProducts placement="top"/><AdminProducts placement="bottom"/></> : section === "photos" ? <AdminHeroImages/> : <AdminLearningSection initialSection={section} fixedSection={section}/>}</div>
    </div>
  </main>;
}



function AdminProfile() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error("Your session could not be found. Please sign in again.");
      const [profileResult, rolesResult] = await Promise.all([
        supabase.from("member_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (rolesResult.error) throw rolesResult.error;
      return { user, profile: profileResult.data, roles: rolesResult.data ?? [] };
    },
  });
  async function signOut() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  const user = query.data?.user;
  const profile = query.data?.profile;
  const roles = query.data?.roles ?? [];
  const metadata = user?.user_metadata ?? {};
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || String(metadata.full_name ?? metadata.name ?? "Administrator");
  const value = (v: unknown) => v === null || v === undefined || v === "" ? "Not provided" : String(v);
  const date = (v?: string | null) => v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "Not available";
  const fields = [
    ["Email address", profile?.email || user?.email, Mail],
    ["Phone number", profile?.phone, Phone],
    ["Country", profile?.country, MapPin],
    ["Age", profile?.age, CalendarClock],
    ["Gender", profile?.gender, UserRound],
    ["Member approval", profile?.approval_status, BadgeCheck],
    ["Email verification", profile?.email_verified_at ? `Verified · ${date(profile.email_verified_at)}` : user?.email_confirmed_at ? "Verified" : "Not verified", ShieldCheck],
    ["Account created", date(user?.created_at), CalendarClock],
    ["Last sign in", date(user?.last_sign_in_at), Activity],
    ["Profile last updated", date(profile?.updated_at), CalendarClock],
  ] as const;
  return <section className="ng-admin-profile">
    {query.isPending ? <p>Loading your account details…</p> : query.isError ? <p role="alert">Could not load your profile. {query.error.message}</p> : <>
      <div className="ng-admin-profile-heading">
        <div className="ng-admin-profile-avatar">{name.split(/\s+/).map(part=>part[0]).join("").slice(0,2).toUpperCase()}</div>
        <div className="ng-admin-profile-identity"><p className="ng-admin-eyebrow">ADMINISTRATOR ACCOUNT</p><h2>{name}</h2><p>{value(user?.email)}</p></div>
        <span className="ng-admin-profile-role"><ShieldCheck size={15}/> Administrator</span>
      </div>
      <section className="ng-admin-profile-section"><div className="ng-admin-profile-section-heading"><div><h3>Personal and account information</h3><p>Details associated with your signed-in account.</p></div></div>
        <div className="ng-admin-profile-grid">{fields.map(([label,v,Icon])=><div className="ng-admin-profile-field" key={label}><span className="ng-admin-profile-field-icon"><Icon size={17}/></span><div><span>{label}</span><strong>{value(v)}</strong></div></div>)}</div>
      </section>
      <section className="ng-admin-profile-section"><div className="ng-admin-profile-section-heading"><div><h3>Access and security</h3><p>Roles and identifiers associated with this account.</p></div></div>
        <div className="ng-admin-profile-security"><div><span>Assigned roles</span><strong>{roles.length ? roles.map(item=>item.role).join(", ") : "No role records found"}</strong></div><div><span>Account user ID</span><strong className="ng-admin-profile-id">{value(user?.id)}</strong></div><div><span>Authentication provider</span><strong>{value(user?.app_metadata?.provider ?? "Email / password")}</strong></div></div>
      </section>
      {!profile && <p className="ng-admin-profile-note">No member profile record is linked to this account yet. Available authentication and role details are shown above.</p>}
      <div className="ng-admin-profile-actions"><Button variant="outline" onClick={() => void query.refetch()}>Refresh details</Button><Button onClick={() => void signOut()}><LogOut size={16}/>Sign out</Button></div>
    </>}
  </section>;
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
