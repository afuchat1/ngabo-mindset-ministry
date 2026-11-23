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
import { useMemberDashboard } from "./use-platform";
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
  children: ReactNode;
};

export function MemberWorkspace({ active, title, kicker, description, children }: WorkspaceProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useMemberDashboard();
  const profile = profileQuery.data?.profile;
  const counts = profileQuery.data?.counts;
  const navigationCounts: Record<string, number | undefined> = {
    "/dashboard/courses": counts?.courses,
    "/dashboard/quizzes": counts?.quizzes,
    "/dashboard/support": counts?.support,
  };
  const name = profile ? displayName(profile) : "Member";
  const initials = profile
    ? `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : "N";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mp-workspace min-h-[100dvh]">
      <aside className={`mp-sidebar ${mobileMenuOpen ? "mp-sidebar-open" : ""}`}>
        <div className="mp-brand">
          <img src={logoImage} alt="NGABO (MMA) Network & Ministries" className="mp-brand-logo" />
          <div>
            <p className="mp-brand-name">NGABO</p>
            <p className="mp-brand-subtitle">Member</p>
          </div>
          <button
            type="button"
            className="mp-icon-button mp-mobile-close"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <p className="mp-nav-label">WORKSPACE</p>
        <nav aria-label="Member navigation" className="mp-navigation">
          {memberNavigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`mp-nav-link ${active === to ? "is-active" : ""}`}
              aria-current={active === to ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {(navigationCounts[to] ?? 0) > 0 && (
                <span
                  className="ml-auto min-w-5 rounded-full bg-[#f2e5d8] px-1.5 py-0.5 text-center text-[10px] font-bold leading-4 text-[#935a3e]"
                  aria-label={`${navigationCounts[to]} ${label.toLowerCase()} notifications`}
                >
                  {(navigationCounts[to] ?? 0) > 99 ? "99+" : navigationCounts[to]}
                </span>
              )}
              {active === to && <span className="mp-nav-indicator" />}
            </Link>
          ))}
        </nav>
        <div className="mp-sidebar-note">
          <div className="mp-note-icon"><ShieldCheck size={17} /></div>
          <p>Learning · Community · Service</p>
        </div>
        <div className="mp-sidebar-foot">
          <div className="mp-avatar">{initials || "N"}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#283b36]">{name}</p>
            <p className="truncate text-xs text-[#78847d]">NGABO member</p>
          </div>
          <Link to="/dashboard/profile" className="mp-icon-button" aria-label="Open profile settings">
            <Settings2 size={17} />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mp-icon-button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut size={17} />
          </Button>
        </div>
      </aside>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mp-mobile-scrim"
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <main className="mp-main">
        <header className="mp-topbar">
          <button
            type="button"
            className="mp-icon-button mp-menu-trigger"
            aria-label="Open navigation"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="mp-breadcrumb">
            <Compass size={15} />
            <span>Workspace</span>
            <span className="mp-breadcrumb-slash">/</span>
            <span className="mp-breadcrumb-current">{title}</span>
          </div>
          <div className="mp-topbar-right">
            
            <div className="mp-avatar mp-avatar-small">{initials || "N"}</div>
          </div>
        </header>
        <div className="mp-content">
          <div className="mp-page-heading">
            <div>
              <p className="mp-kicker">{kicker}</p>
              <h1>{title}</h1>
              {description && <p className="mp-page-description">{description}</p>}
            </div>
            {profile?.email_verified_at && profile?.approval_status === "approved" && (
              <div className="mp-member-badge"><ShieldCheck size={15} /> Verified member</div>
            )}
          </div>
          {children}
          <footer className="mp-footer">
            <span>NGABO Ministries &amp; Missions of Africa</span>
            
          </footer>
        </div>
      </main>
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
