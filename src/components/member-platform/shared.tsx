import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  CircleHelp,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  Menu,
  Inbox,
  Settings2,
  ShieldCheck,
  UserRound,
  X,
  LogOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMemberDashboard, useMemberSupportTickets } from "./use-platform";
import { getMemberInbox } from "@/lib/member-platform.functions";
import { SupportFab } from "./support-fab";
import { displayName } from "@/lib/member-platform";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/ngabo-logo.jpg";
import "./workspace.css";

const memberNavigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { to: "/dashboard/quizzes", label: "Quizzes", icon: CircleHelp },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy },
  { to: "/dashboard/profile", label: "My profile", icon: UserRound },
] as const;

type WorkspaceProps = {
  active: string;
  title: string;
  kicker: string;
  description?: string | undefined;
  pendingAccess?: boolean;
  children: ReactNode;
};

export function MemberWorkspace({ active, title, kicker, description, pendingAccess = false, children }: WorkspaceProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const inboxTriggerRef = useRef<HTMLButtonElement>(null);
  const [inboxTop, setInboxTop] = useState(80);
  const inboxQuery = useQuery({ queryKey: ["member-inbox"], queryFn: () => getMemberInbox(), refetchInterval: 30000 });

  useEffect(() => {
    if (!openMenu) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const clickedMenu = target?.closest<HTMLElement>(".mp-nav-dropdown[data-menu-key]");
      if (clickedMenu?.dataset.menuKey !== openMenu) {
        setOpenMenu(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu]);
  useEffect(() => {\n    if (openMenu !== "Inbox") return;\n    const updatePosition = () => {\n      const rect = inboxTriggerRef.current?.getBoundingClientRect();\n      if (rect) setInboxTop(Math.max(12, rect.bottom + 8));\n    };\n    updatePosition();\n    window.addEventListener("resize", updatePosition);\n    window.addEventListener("scroll", updatePosition, true);\n    return () => { window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };\n  }, [openMenu]);\n  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useMemberDashboard();
  const supportQuery = useMemberSupportTickets();
  const unreadSupportCount = (supportQuery.data ?? []).filter((ticket) => ticket.status === "awaiting_member").length;
  const unreadInboxCount = inboxQuery.data?.unread_count ?? 0;
  function toggleInbox() {
    setOpenMenu(openMenu === "Inbox" ? null : "Inbox");
  }
  const profile = profileQuery.data?.profile;
  const name = profile ? displayName(profile) : "Member";
  const initials = profile ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() : "N";
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  const groups = [
    { label: "Learning", icon: BookOpen, items: [{ to: "/dashboard/courses", label: "Courses", icon: BookOpen }, { to: "/dashboard/quizzes", label: "Quizzes", icon: CircleHelp }] },
    { label: "Community", icon: LifeBuoy, items: [{ to: "/dashboard/support", label: "Support", icon: LifeBuoy, count: unreadSupportCount }] },
  ] as const;
  return (
    <div className="mp-workspace min-h-[100dvh]">
      {!pendingAccess && <div className="mp-news-updates-top">
        <a href="/" className="mp-news-updates-banner" aria-label="Read our daily news and updates on the homepage">
          <span>Read our daily</span>
          <span className="mp-news-updates-words" aria-hidden="true">
            <span>News</span>
            <span>Updates</span>
          </span>
          <span className="sr-only">News and updates</span>
        </a>
      </div>}
      <main className="mp-main">
        {!pendingAccess && <header className="mp-topbar mp-member-header">
          <Link to="/dashboard" className="mp-brand mp-header-brand">
            <img src={logoImage} alt="NGABO (MMA) Network & Ministries" className="mp-brand-logo" />
            <span><p className="mp-brand-name">NGABO</p><p className="mp-brand-subtitle">Member space</p></span>
          </Link>
          <nav className="mp-header-navigation" aria-label="Member navigation">
            <Link to="/dashboard" className={`mp-header-link ${active === "/dashboard" ? "is-active" : ""}`}><Compass size={16}/> Overview</Link>
            {groups.map(group => <div className="mp-nav-dropdown" data-menu-key={group.label} key={group.label}>
              <button type="button" className={`mp-header-link ${group.items.some(item => active === item.to) ? "is-active" : ""}`} aria-expanded={openMenu === group.label} onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}>
                <group.icon size={16}/>{group.label}
              </button>
              {openMenu === group.label && <div className="mp-dropdown-panel">{group.items.map(item=><Link key={item.to} to={item.to} onClick={()=>setOpenMenu(null)} className={`mp-dropdown-item ${active === item.to ? "is-active" : ""}`}><item.icon size={16}/><span>{item.label}</span>{("count" in item && item.count && item.count>0) ? <span className="mp-dropdown-count">{item.count}</span> : null}</Link>)}</div>}
            </div>)}

          </nav>
          <div className="mp-header-utilities">
            <div className="mp-nav-dropdown mp-inbox-menu" data-menu-key="Inbox">
              <button type="button" ref={inboxTriggerRef} className="mp-header-utility-button mp-inbox-trigger" aria-label={unreadInboxCount ? `Inbox, ${unreadInboxCount} unread messages` : "Open inbox"} aria-expanded={openMenu === "Inbox"} onClick={() => void toggleInbox()}>
                <Inbox size={18}/>
                <span>Inbox</span>
                {unreadInboxCount > 0 && <span className="mp-inbox-badge">{unreadInboxCount > 99 ? "99+" : unreadInboxCount}</span>}
              </button>
              {openMenu === "Inbox" && <div className="mp-dropdown-panel mp-inbox-panel" style={{ top: inboxTop }}>
                <div className="mp-inbox-heading"><strong>Inbox</strong><span>{unreadInboxCount} unread</span></div>
                {inboxQuery.isPending ? <p className="mp-inbox-empty">Loading messages…</p>
                  : inboxQuery.isError ? <p className="mp-inbox-empty">Messages could not be loaded. Close and try again.</p>
                  : inboxQuery.data?.items.length ? inboxQuery.data.items.map(item => <Link key={item.id} to="/dashboard/support" onClick={() => setOpenMenu(null)} className={`mp-inbox-item ${item.is_unread ? "is-unread" : ""}`}>
                    <span className="mp-inbox-item-title">{item.subject}{item.is_unread && <span className="mp-inbox-item-unread">Unread</span>}</span>
                    <span className="mp-inbox-item-preview">{item.body}</span>
                    <span className="mp-inbox-item-date">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</span>
                  </Link>)
                  : <p className="mp-inbox-empty">You’re all caught up. New replies and messages will appear here.</p>}
                <Link to="/dashboard/support" onClick={() => setOpenMenu(null)} className="mp-inbox-footer">Open support conversations <ArrowRight size={14}/></Link>
              </div>}
            </div>
            <div ref={avatarMenuRef} className="mp-nav-dropdown mp-header-user-menu" data-menu-key="Menu">
              <button type="button" className="mp-header-utility-button" aria-label="Open menu" aria-expanded={openMenu === "Menu"} onClick={() => setOpenMenu(openMenu === "Menu" ? null : "Menu")}>
                <Menu size={20}/>
              </button>
              {openMenu === "Menu" && <div className="mp-dropdown-panel mp-avatar-dropdown">
                <div className="mp-avatar-menu-name">{name}</div>
                <Link to="/dashboard/profile" onClick={() => setOpenMenu(null)} className="mp-dropdown-item"><Settings2 size={16}/>My profile</Link>
                <button type="button" onClick={() => void signOut()} className="mp-dropdown-item"><LogOut size={16}/>Sign out</button>
              </div>}
            </div>
          </div>
        </header>}
        {pendingAccess && <header className="mp-topbar"><div className="mp-breadcrumb"><Link to="/pending-approval" className="inline-flex items-center gap-1 text-[#DE3F20]">Back to status</Link></div></header>}
        <div className="mp-content">
          <div className="mp-page-heading"><div><p className="mp-kicker">{kicker}</p><h1>{title}</h1>{description && <p className="mp-page-description">{description}</p>}</div>{profile?.email_verified_at && profile?.approval_status === "approved" && <div className="mp-member-badge"><ShieldCheck size={15}/>Verified member</div>}</div>
          {children}
          <footer className="mp-footer"><span>NGABO Ministries &amp; Missions of Africa</span></footer>
        </div>
      </main>
      {!pendingAccess && <SupportFab unreadCount={unreadSupportCount} onClick={()=>void navigate({to:"/dashboard/support"})}/>}
    </div>
  );
}

export function SectionHeading({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mp-section-heading">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading your learning space" }: { label?: string }) {
  return (
    <div className="mp-skeleton-wrap" role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="mp-skeleton mp-skeleton-hero" />
      <div className="mp-skeleton-row">
        <div className="mp-skeleton mp-skeleton-card" />
        <div className="mp-skeleton mp-skeleton-card" />
        <div className="mp-skeleton mp-skeleton-card" />
      </div>
      <div className="mp-skeleton mp-skeleton-lines" />
    </div>
  );
}

export function ErrorState({
  title = "We couldn’t load this just now",
  message = "Your work is safe. Try again in a moment.",
  onRetry,
}: {
  title?: string | undefined;
  message?: string | undefined;
  onRetry: () => void;
}) {
  return (
    <div className="mp-state-card" role="alert">
      <div className="mp-state-symbol mp-state-error"><LifeBuoy size={21} /></div>
      <h2>{title}</h2>
      <p>{message}</p>
      <Button variant="outline" onClick={onRetry}>Try again <ArrowRight size={15} /></Button>
    </div>
  );
}

export function EmptyState({
  icon: Icon = GraduationCap,
  title,
  detail,
  action,
}: {
  icon?: typeof GraduationCap;
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="mp-empty-state">
      <div className="mp-empty-art"><Icon size={25} strokeWidth={1.6} /></div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const friendly = normalized.replaceAll("_", " ");
  return <span className={`mp-status mp-status-${normalized.replaceAll("_", "-")}`}>{friendly}</span>;
}

export function MemberWelcome() {
  const query = useMemberDashboard();
  const first = query.data?.profile.first_name || "friend";
  return (
    <div className="mp-welcome-banner">
      <div className="mp-welcome-copy">
        <span className="mp-welcome-overline">NGABO MEMBER</span>
        <h2>Welcome back, {first}.</h2>
        <p>Your learning and activity, all in one place.</p>
      </div>
      <div className="mp-welcome-stamp" aria-hidden="true">
        <div className="mp-stamp-ring"><span>NGABO<br />GROWTH</span><BookOpen size={25} /></div>
      </div>
    </div>
  );
}

export function PageLink({
  to,
  children,
  className = "",
}: {
  to: "/dashboard" | "/dashboard/courses" | "/dashboard/quizzes" | "/dashboard/support" | "/dashboard/profile";
  children: ReactNode;
  className?: string;
}) {
  return <Link to={to} className={`mp-text-link ${className}`}>{children}<ArrowRight size={15} /></Link>;
}
