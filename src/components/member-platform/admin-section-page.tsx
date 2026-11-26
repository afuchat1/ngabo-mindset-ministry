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
      <AdminWorkspaceHeader active={section} currentLabel={current.label} onOpenNavigation={() => setMobileNavOpen(true)} />
      <div className="ng-admin-page-content">{section === "overview" ? <AdminOverview/> : section === "profile" ? <AdminProfile/> : section === "events" ? <AdminEventsPage/> : section === "products" ? <><AdminProducts placement="top"/><AdminProducts placement="bottom"/></> : section === "photos" ? <AdminHeroImages/> : <AdminLearningSection initialSection={section} fixedSection={section}/>}</div>
    </div>
  </main>;
}



function AdminWorkspaceHeader({ active, currentLabel, onOpenNavigation }: { active: AdminSection; currentLabel: string; onOpenNavigation: () => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const inboxTriggerRef = useRef<HTMLButtonElement>(null);
  const [inboxTop, setInboxTop] = useState(80);
  const inboxQuery = useQuery({ queryKey: ["member-inbox"], queryFn: () => getMemberInbox(), refetchInterval: 30000 });
  const unreadCount = inboxQuery.data?.unread_count ?? 0;
  useEffect(() => {
    if (!openMenu) return;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const menu = target?.closest<HTMLElement>(".mp-nav-dropdown[data-menu-key]");
      if (menu?.dataset.menuKey !== openMenu) setOpenMenu(null);
    };
    const closeEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenMenu(null); };
    document.addEventListener("pointerdown", closeOutside); document.addEventListener("keydown", closeEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeEscape); };
  }, [openMenu]);
  useEffect(() => {
    if (openMenu !== "Inbox") return;
    const update = () => { const rect = inboxTriggerRef.current?.getBoundingClientRect(); if (rect) setInboxTop(Math.max(12, rect.bottom + 8)); };
    update(); window.addEventListener("resize", update); window.addEventListener("scroll", update, true);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update, true); };
  }, [openMenu]);
  const groups = [
    { label: "Learning", icon: BookOpen, items: [{ to: "/admin/courses", label: "Courses", icon: BookOpen }, { to: "/admin/quizzes", label: "Quizzes", icon: CircleHelp }] },
    { label: "Community", icon: UsersRound, items: [{ to: "/admin/network", label: "Network", icon: UsersRound }, { to: "/admin/support", label: "Support", icon: LifeBuoy }] },
  ] as const;
  return <div className="mp-workspace ng-admin-shared-header">
    <div className="mp-news-updates-top"><a href="/" className="mp-news-updates-banner" aria-label="Read our daily news and updates on the homepage"><span>Read our daily</span><span className="mp-news-updates-words" aria-hidden="true"><span>News</span><span>Updates</span></span><span className="sr-only">News and updates</span></a></div>
    <header className="mp-topbar mp-member-header">
      <button type="button" className="ng-admin-menu-trigger" aria-label="Open administration navigation" onClick={onOpenNavigation}><Menu size={20}/></button>
      <Link to="/admin/overview" className="mp-brand mp-header-brand"><img src={logoImage} alt="NGABO (MMA) Network & Ministries" className="mp-brand-logo"/><span><p className="mp-brand-name">NGABO</p><p className="mp-brand-subtitle">Administration</p></span></Link>
      <nav className="mp-header-navigation" aria-label="Administration navigation">
        <Link to="/admin/overview" className={`mp-header-link ${active === "overview" ? "is-active" : ""}`}><Compass size={16}/> Overview</Link>
        {groups.map(group => <div className="mp-nav-dropdown" data-menu-key={group.label} key={group.label}><button type="button" className={`mp-header-link ${group.items.some(item => item.to === `/admin/${active}`) ? "is-active" : ""}`} aria-expanded={openMenu === group.label} onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}><group.icon size={16}/>{group.label}<ChevronDown className="mp-dropdown-chevron" size={13}/></button>{openMenu === group.label && <div className="mp-dropdown-panel">{group.items.map(item => <Link key={item.to} to={item.to as any} onClick={() => setOpenMenu(null)} className={`mp-dropdown-item ${item.to === `/admin/${active}` ? "is-active" : ""}`}><item.icon size={16}/><span>{item.label}</span></Link>)}</div>}</div>)}
      </nav>
      <div className="mp-header-utilities">
        <div className="mp-nav-dropdown mp-inbox-menu" data-menu-key="Inbox"><button type="button" ref={inboxTriggerRef} className="mp-header-utility-button mp-inbox-trigger" aria-label={unreadCount ? `Inbox, ${unreadCount} unread messages` : "Open inbox"} aria-expanded={openMenu === "Inbox"} onClick={() => setOpenMenu(openMenu === "Inbox" ? null : "Inbox")}><Inbox size={18}/><span>Inbox</span>{unreadCount > 0 && <span className="mp-inbox-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}</button>
          {openMenu === "Inbox" && <div className="mp-dropdown-panel mp-inbox-panel" style={{ top: inboxTop }}><div className="mp-inbox-heading"><strong>Inbox</strong><span>{unreadCount} unread</span></div>{inboxQuery.isPending ? <p className="mp-inbox-empty">Loading messages…</p> : inboxQuery.isError ? <p className="mp-inbox-empty">Messages could not be loaded. Close and try again.</p> : inboxQuery.data?.items.length ? inboxQuery.data.items.map(item => <Link key={item.id} to="/admin/support" onClick={() => setOpenMenu(null)} className={`mp-inbox-item ${item.is_unread ? "is-unread" : ""}`}><span className="mp-inbox-item-title">{item.subject}{item.is_unread && <span className="mp-inbox-item-unread">Unread</span>}</span><span className="mp-inbox-item-preview">{item.body}</span><span className="mp-inbox-item-date">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</span></Link>) : <p className="mp-inbox-empty">You’re all caught up. New replies and messages will appear here.</p>}<Link to="/admin/support" onClick={() => setOpenMenu(null)} className="mp-inbox-footer">Open support conversations <ArrowUpRight size={14}/></Link></div>}</div>
        <div className="mp-nav-dropdown mp-header-user-menu" data-menu-key="Menu"><button type="button" className="mp-header-utility-button" aria-label="Open menu" aria-expanded={openMenu === "Menu"} onClick={() => setOpenMenu(openMenu === "Menu" ? null : "Menu")}><Menu size={20}/></button>{openMenu === "Menu" && <div className="mp-dropdown-panel mp-avatar-dropdown"><div className="mp-avatar-menu-name">Administration</div><Link to="/admin/profile" onClick={() => setOpenMenu(null)} className="mp-dropdown-item"><Settings2 size={16}/>My profile</Link></div>}</div>
      </div>
    </header>
  </div>;
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
