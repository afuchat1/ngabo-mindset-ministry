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
  Settings2,
  ShieldCheck,
  UserRound,
  X,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useMemberDashboard, useMemberSupportTickets } from "./use-platform";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useMemberDashboard();
  const supportQuery = useMemberSupportTickets();
  const unreadSupportCount = (supportQuery.data ?? []).filter((ticket) => ticket.status === "awaiting_member").length;
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
      <main className="mp-main">
        {!pendingAccess && <header className="mp-topbar mp-member-header">
          <Link to="/dashboard" className="mp-brand mp-header-brand">
            <img src={logoImage} alt="NGABO (MMA) Network & Ministries" className="mp-brand-logo" />
            <span><p className="mp-brand-name">NGABO</p><p className="mp-brand-subtitle">Member space</p></span>
          </Link>
          <nav className="mp-header-navigation" aria-label="Member navigation">
            <Link to="/dashboard" className={`mp-header-link ${active === "/dashboard" ? "is-active" : ""}`}><Compass size={16}/> Overview</Link>
            {groups.map(group => <div className="mp-nav-dropdown" key={group.label}>
              <button type="button" className={`mp-header-link ${group.items.some(item => active === item.to) ? "is-active" : ""}`} aria-expanded={openMenu === group.label} onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}>
                <group.icon size={16}/>{group.label}<ArrowRight className="mp-dropdown-chevron" size={13}/>
              </button>
              {openMenu === group.label && <div className="mp-dropdown-panel">{group.items.map(item=><Link key={item.to} to={item.to} onClick={()=>setOpenMenu(null)} className={`mp-dropdown-item ${active === item.to ? "is-active" : ""}`}><item.icon size={16}/><span>{item.label}</span>{("count" in item && item.count && item.count>0) ? <span className="mp-dropdown-count">{item.count}</span> : null}</Link>)}</div>}
            </div>)}

          </nav>
          <div className="mp-nav-dropdown mp-header-user-menu">
            <button type="button" className="mp-header-avatar-button" aria-label="Open account menu" aria-expanded={openMenu === "Avatar"} onClick={() => setOpenMenu(openMenu === "Avatar" ? null : "Avatar")}>
              <span className="mp-avatar mp-avatar-small">{initials || "N"}</span>
            </button>
            {openMenu === "Avatar" && <div className="mp-dropdown-panel mp-avatar-dropdown">
              <div className="mp-avatar-menu-name">{name}</div>
              <Link to="/dashboard/profile" onClick={() => setOpenMenu(null)} className="mp-dropdown-item"><Settings2 size={16}/>My profile</Link>
              <button type="button" onClick={() => void signOut()} className="mp-dropdown-item"><LogOut size={16}/>Sign out</button>
            </div>}
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
