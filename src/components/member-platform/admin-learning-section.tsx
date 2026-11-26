import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BookOpen,
  Check,
  CircleHelp,
  ClipboardList,
  LifeBuoy,
  Network,
  MailCheck,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminPlatformData,
  useArchiveAdminCourse,
  useArchiveAdminQuiz,
  useReplyToSupportTicketAsAdmin,
  useReviewMemberApproval,
  useSaveAdminCourse,
  useSaveAdminQuiz,
} from "./use-platform";
import { EmptyState, ErrorState, LoadingState, SectionHeading, StatusPill } from "./shared";
import { formatCoursePrice, type Course, type MemberProfile, type SupportTicket } from "@/lib/member-platform";
import { supabase } from "@/integrations/supabase/client";
import "./workspace.css";
import { AdminNetworkGroups } from "./network-groups";

type AdminTicket = SupportTicket & {
  member: MemberProfile | null;
  messages: Array<{ id: string; sender_role: string; body: string; created_at: string }>;
};
type AdminQuiz = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  is_active: boolean;
};
type ApprovalMember = MemberProfile & { approval: { status: string } | null; role: "admin" | "user" | "staff" | "support" };
type AdminData = {
  profiles: MemberProfile[];
  roles: Array<{ user_id: string; role: "admin" | "user" | "staff" | "support" }>;
  approvals: ApprovalMember[];
  courses: Course[];
  quizzes: AdminQuiz[];
  enrollments: number;
  tickets: AdminTicket[];
  counts: {
    pendingApprovals: number;
    openTickets: number;
    activeCourses: number;
    activeQuizzes: number;
    members: number;
  };
};
type Section = "members" | "support" | "courses" | "quizzes" | "network";
type QuizQuestionDraft = { prompt: string; choices: string[]; correct_index: number };

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function memberName(member?: Pick<MemberProfile, "first_name" | "last_name"> | null) {
  return member ? [member.first_name, member.last_name].filter(Boolean).join(" ") || "Member" : "Member";
}

export function AdminLearningSection({ initialSection = "members" }: { initialSection?: Section }) {
  const query = useAdminPlatformData();
  const [section, setSection] = useState<Section>(initialSection);
  const [search, setSearch] = useState("");
  useEffect(() => { if (initialSection === "support") setSection("support"); }, [initialSection]);
  const data = query.data as AdminData | undefined;
  const sectionLabels: Array<{ key: Section; label: string; icon: typeof UsersRound }> = [
    { key: "members", label: "Member review", icon: UsersRound },
    { key: "support", label: "Support", icon: LifeBuoy },
    { key: "courses", label: "Courses", icon: BookOpen },
    { key: "quizzes", label: "Quizzes", icon: CircleHelp },
    { key: "network", label: "Network", icon: Network },
  ];


  return (
    <main className={`mp-admin-shell ${section === "members" ? "mp-admin-overview" : ""}`}>
      <div className="mp-admin-inner">
        <div className="mp-admin-title">
          <div><p className="mp-kicker">NGABO ADMIN</p><h1>Learning administration</h1></div>
        </div>
        {query.isPending ? (
          <LoadingState label="Loading learning administration" />
        ) : query.isError ? (
          <ErrorState title="Administration data is unavailable" message={query.error instanceof Error ? query.error.message : "Please refresh and try again."} onRetry={() => void query.refetch()} />
        ) : data ? (
          <>
            <div className="mp-admin-stats">
              <AdminStat icon={UsersRound} value={data.counts.members} label="Members" />
              <AdminStat icon={ClipboardList} value={data.counts.pendingApprovals} label="Awaiting review" warm />
              <AdminStat icon={MessageCircle} value={data.counts.openTickets} label="Open support" />
              <AdminStat icon={BookOpen} value={data.counts.activeCourses} label="Active courses" warm />
              <AdminStat icon={CircleHelp} value={data.counts.activeQuizzes} label="Active quizzes" />
            </div>
            <nav className="mp-tabs" role="tablist" aria-label="Admin learning sections">
              {sectionLabels.map(({ key, label, icon: Icon }) => {
                const count = key === "members"
                  ? data.counts.pendingApprovals
                  : key === "support"
                    ? data.counts.openTickets
                    : key === "courses"
                      ? data.counts.activeCourses
                       : key === "quizzes" ? data.counts.activeQuizzes : 0;
                return (
                <button type="button" key={key} role="tab" aria-selected={section === key} className="mp-tab" onClick={() => setSection(key)}>
                  <Icon className="mr-1 inline-block align-[-3px]" size={14} /> {label}
                  {count > 0 ? <span className="ml-1 rounded-full bg-[#fff0f0] px-1.5 py-0.5 text-[11px] text-[#DE3F20]" aria-label={`${count} ${label.toLowerCase()}`}>{count > 99 ? "99+" : count}</span> : null}
                </button>
              );})}
            </nav>
            {section === "members" && <MemberReview data={data} search={search} setSearch={setSearch} />}
            {section === "support" && <AdminSupport tickets={data.tickets} />}
            {section === "courses" && <CourseManagement courses={data.courses} />}
            {section === "quizzes" && <QuizManagement quizzes={data.quizzes} courses={data.courses} />}
            {section === "network" && <AdminNetworkGroups />}
          </>
        ) : null}
        <footer className="mp-footer"><span>NGABO (MMA)</span><span></span></footer>
      </div>
    </main>
  );
}

function AdminStat({ icon: Icon, value, label, warm = false }: { icon: typeof UsersRound; value: number; label: string; warm?: boolean }) {
  return <div className="mp-admin-stat"><div className="mb-2 flex items-center justify-between"><span>{label}</span><Icon size={15} className="text-[#DE3F20]" /></div><strong>{value}</strong></div>;
}


function MemberReview({ data, search, setSearch }: { data: AdminData; search: string; setSearch: (value: string) => void }) {
  const review = useReviewMemberApproval();
  const queryClient = useQueryClient();
  const [roleBusy, setRoleBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase().trim();
    return data.approvals.filter((member) => {
      const haystack = [member.first_name, member.last_name, member.email, member.country, member.phone].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(term) && (statusFilter === "all" || member.approval_status === statusFilter);
    });
  }, [data.approvals, search, statusFilter]);
  const active = data.approvals.find((member) => member.user_id === selectedId) ?? null;
  const filters = [
    { key: "all" as const, label: "All members", count: data.approvals.length },
    { key: "pending" as const, label: "Pending", count: data.approvals.filter((member) => member.approval_status === "pending").length },
    { key: "approved" as const, label: "Approved", count: data.approvals.filter((member) => member.approval_status === "approved").length },
    { key: "rejected" as const, label: "Declined", count: data.approvals.filter((member) => member.approval_status === "rejected").length },
  ];
  async function setRole(user_id: string, role: "admin" | "user" | "staff" | "support") {
    setError(""); setRoleBusy(true);
    try {
      const { error: roleError } = await supabase.rpc("admin_set_user_role", { p_user_id: user_id, p_role: role });
      if (roleError) throw roleError;
      await queryClient.invalidateQueries({ queryKey: ["member-platform", "admin"] });
    } catch (err) { setError(err instanceof Error ? err.message : "Could not update this user role."); }
    finally { setRoleBusy(false); }
  }
  async function setStatus(user_id: string, status: "approved" | "rejected") {
    setError("");
    try { await review.mutateAsync({ user_id, status }); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not update member access."); }
  }
  return (
    <section className="mp-admin-panel">
      <SectionHeading title="Members" detail="Browse registered users and open any profile to review all submitted details." />
      <nav className="mp-tabs mp-member-review-tabs" role="tablist" aria-label="Filter members by approval status">
        {filters.map((filter) => <button key={filter.key} type="button" role="tab" aria-selected={statusFilter === filter.key} className="mp-tab" onClick={() => setStatusFilter(filter.key)}>{filter.label}<span className="mp-tab-count">{filter.count}</span></button>)}
      </nav>
      <div className="mp-filter-row">
        <span className="mp-pagination-note">Showing {filteredMembers.length} of {data.approvals.length} registered users</span>
        <label className="mp-search"><Search size={15} /><input aria-label="Search members" placeholder="Search name, email, country or phone" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      </div>
      {!filteredMembers.length ? (
        <EmptyState icon={UsersRound} title="No members found" detail={search ? "Try another search or clear the filter." : "There are no members in this category yet."} action={search ? <Button size="sm" variant="outline" onClick={() => setSearch("")}>Clear search</Button> : undefined} />
      ) : (
        <div className="mp-member-directory" aria-label="Registered users">
          <div className="mp-member-directory-head"><span>Member</span><span>Country</span><span>Registered</span><span>Status</span><span>Profile</span></div>
          {filteredMembers.map((member) => (
            <div className="mp-member-directory-row" key={member.user_id}>
              <div className="mp-member-directory-identity">
                <span className="mp-member-directory-avatar" aria-hidden="true">{(member.first_name?.[0] ?? "M").toUpperCase()}{(member.last_name?.[0] ?? "").toUpperCase()}</span>
                <span><strong>{memberName(member)}</strong><small>{member.email}</small></span>
              </div>
              <span className="mp-member-directory-country">{member.country || "—"}</span>
              <span className="mp-member-directory-date">{formatDate(member.created_at)}</span>
              <span><StatusPill status={member.approval_status} /></span>
              <span><Button type="button" size="sm" variant="outline" className="mp-member-view-button" onClick={() => { setSelectedId(member.user_id); setError(""); }}>View details</Button></span>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!active} onOpenChange={(open) => { if (!open) { setSelectedId(null); setError(""); } }}>
        <DialogContent className="mp-modal-content sm:max-w-xl">
          {active && <>
            <DialogHeader><DialogTitle>{memberName(active)}</DialogTitle><DialogDescription>Complete registration profile and account review</DialogDescription></DialogHeader>
            <div className="mp-member-profile-summary"><div><strong>{active.email}</strong><StatusPill status={active.approval_status} /></div><div className="mp-field mt-3"><Label htmlFor="member-role">Assigned role</Label><select id="member-role" className="mp-select" value={active.role} disabled={roleBusy} onChange={(event) => void setRole(active.user_id, event.target.value as "admin" | "user" | "staff" | "support")}><option value="user">Member</option><option value="support">Support team</option><option value="staff">Staff</option><option value="admin">Admin</option></select><p className="mp-pagination-note">Role changes take effect in the database immediately.</p></div></div>
            <div className="mp-member-review-details">
              <div className="mp-info-row"><span>First name</span><strong>{active.first_name || "—"}</strong></div>
              <div className="mp-info-row"><span>Last name</span><strong>{active.last_name || "—"}</strong></div>
              <div className="mp-info-row"><span>Email address</span><strong>{active.email || "—"}</strong></div>
              <div className="mp-info-row"><span>Email verification</span><strong className={active.email_verified_at ? "mp-member-verified" : ""}>{active.email_verified_at ? "Verified" : "Not verified"}</strong></div>
              <div className="mp-info-row"><span>Phone</span><strong>{active.phone || "—"}</strong></div>
              <div className="mp-info-row"><span>Country</span><strong>{active.country || "—"}</strong></div>
              <div className="mp-info-row"><span>Age</span><strong>{active.age ?? "—"}</strong></div>
              <div className="mp-info-row"><span>Gender</span><strong>{active.gender?.replaceAll("_", " ") || "—"}</strong></div>
              <div className="mp-info-row"><span>Registered</span><strong>{formatDate(active.created_at)}</strong></div>
              <div className="mp-info-row"><span>Email verified on</span><strong>{formatDate(active.email_verified_at)}</strong></div>
              <div className="mp-info-row"><span>Account status</span><strong>{active.approval_status || "pending"}</strong></div>
            </div>
            <div className="mp-member-review-actions">
              {active.approval_status !== "approved" && <Button className="mp-btn-primary mp-btn-small" disabled={!active.email_verified_at || review.isPending} onClick={() => void setStatus(active.user_id, "approved")} title={!active.email_verified_at ? "Member must verify email before approval" : "Approve member"}><Check size={14} />{review.isPending ? "Updating…" : "Approve access"}</Button>}
              {active.approval_status !== "rejected" && <Button variant="outline" className="mp-btn-small" disabled={review.isPending} onClick={() => void setStatus(active.user_id, "rejected")}>Decline application</Button>}
              {!active.email_verified_at && <p className="mp-pagination-note">This member must verify their email before approval is available.</p>}
            </div>
            {error && <p className="mp-form-error" role="alert">{error}</p>}
          </>}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AdminSupport({ tickets }: { tickets: AdminTicket[] }) {
  const reply = useReplyToSupportTicketAsAdmin();
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [message, setMessage] = useState("");
  const [resolve, setResolve] = useState(false);
  const [error, setError] = useState("");
  const active = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0] ?? null;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!active) return;
    setError("");
    try {
      await reply.mutateAsync({ ticket_id: active.id, message: message.trim(), resolve });
      setMessage("");
      setResolve(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send this reply.");
    }
  }

  return (
    <section className="mp-admin-panel">
      <SectionHeading title="Member support" detail="Continue conversations with care. Resolving a ticket closes it for the member." />
      {!tickets.length ? (
        <EmptyState icon={LifeBuoy} title="No support requests" detail="Member requests will appear here when they need a hand." />
      ) : (
        <div className="mp-ticket-admin">
          <div className="mp-ticket-list">
            {tickets.map((ticket) => (
              <button key={ticket.id} type="button" className={`mp-ticket-row ${active?.id === ticket.id ? "is-selected" : ""}`} onClick={() => { setSelectedId(ticket.id); setError(""); }}>
                <strong>{ticket.subject}</strong>
                <span className="font-mono text-xs font-semibold tracking-wide text-[#DE3F20]">#{String(ticket.ticket_number).padStart(6, "0")}</span>
                <span>{memberName(ticket.member)} · {formatDate(ticket.updated_at)}</span>
                <span className="mt-2"><StatusPill status={ticket.status} /></span>
              </button>
            ))}
          </div>
          {active && (
            <div className="mp-panel mp-ticket-admin-detail">
              <div className="mp-panel-title"><div><h3>{active.subject}</h3><p><span className="font-mono font-semibold text-[#DE3F20]">#{String(active.ticket_number).padStart(6, "0")}</span> · {memberName(active.member)} · {active.member?.email}</p></div><StatusPill status={active.status} /></div>
              <div className="mp-message-list">
                {active.messages.map((item) => (
                  <div key={item.id} className={`mp-message ${item.sender_role === "admin" || item.sender_role === "staff" || item.sender_role === "support" ? "is-staff" : ""}`}>
                    <div className="mp-message-meta"><strong>{item.sender_role === "admin" || item.sender_role === "staff" || item.sender_role === "support" ? "NGABO team" : memberName(active.member)}</strong><span>{formatDate(item.created_at)}</span></div><p>{item.body}</p>
                  </div>
                ))}
              </div>
              {active.status === "resolved" ? (
                <p className="rounded-lg bg-[#f3f5ef] p-3 text-[12px] text-[#738078]">This ticket is closed. No further messages can be sent. The member must open a new request if more help is needed.</p>
              ) : (
                <form className="grid gap-3" onSubmit={send}>
                  <div className="mp-field"><Label htmlFor="admin-support-reply">Your reply</Label><Textarea id="admin-support-reply" required maxLength={5000} placeholder="Write a helpful response…" value={message} onChange={(event) => setMessage(event.target.value)} /></div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="mp-check-row"><input type="checkbox" checked={resolve} onChange={(event) => setResolve(event.target.checked)} /> Mark resolved after replying</label>
                    <Button className="mp-btn-primary mp-btn-small" disabled={reply.isPending || !message.trim()}>{reply.isPending ? "Sending…" : "Send reply"} <Send size={13} /></Button>
                  </div>
                  {error && <p className="mp-form-error" role="alert">{error}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

type CourseDraft = { id?: string; title: string; description: string; price: string; currency: string; is_active: boolean };
const blankCourse: CourseDraft = { title: "", description: "", price: "0", currency: "UGX", is_active: true };

function CourseManagement({ courses }: { courses: Course[] }) {
  const save = useSaveAdminCourse();
  const archive = useArchiveAdminCourse();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CourseDraft>(blankCourse);
  const [confirming, setConfirming] = useState<Course | null>(null);
  const [error, setError] = useState("");
  const activeCourses = courses.filter((course) => course.is_active);

  function show(course?: Course) {
    setError("");
    setDraft(course ? {
      id: course.id,
      title: course.title ?? "",
      description: course.description ?? "",
      price: String(course.price ?? 0),
      currency: course.currency ?? "UGX",
      is_active: course.is_active,
    } : { ...blankCourse });
    setOpen(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await save.mutateAsync({
        id: draft.id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        price: Number(draft.price),
        currency: draft.currency.trim().toUpperCase(),
        is_active: draft.is_active,
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this course.");
    }
  }

  async function confirmArchive() {
    if (!confirming) return;
    setError("");
    try {
      await archive.mutateAsync(confirming.id);
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive this course.");
    }
  }

  return (
    <section className="mp-admin-panel">
      <SectionHeading
        title="Course catalogue"
        detail={`${activeCourses.length} active learning path${activeCourses.length === 1 ? "" : "s"} · archive hides a course from members.`}
        action={<Button size="sm" className="mp-btn-primary mp-btn-small" onClick={() => show()}><Plus size={14} /> Add course</Button>}
      />
      {!courses.length ? (
        <EmptyState icon={BookOpen} title="Your catalogue is ready for its first course" detail="Create a learning path to make it available to approved NGABO members." action={<Button className="mp-btn-primary" onClick={() => show()}>Create a course</Button>} />
      ) : (
        <div className="mp-admin-table-wrap">
          <table className="mp-admin-table">
            <thead><tr><th>Course</th><th>Price</th><th>Member visibility</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{courses.map((course) => (
              <tr key={course.id}>
                <td><strong>{course.title}</strong><div className="mt-1 max-w-sm truncate text-[12px] text-[#777777]">{course.description}</div></td>
                <td>{formatCoursePrice(course.price, course.currency)}</td>
                <td><StatusPill status={course.is_active ? "active" : "archived"} /></td>
                <td>{formatDate(course.created_at)}</td>
                <td><div className="mp-admin-actions">
                  <button type="button" className="mp-admin-action" aria-label={`Edit ${course.title}`} title={`Edit ${course.title}`} onClick={() => show(course)}><Pencil size={14} /></button>
                  {course.is_active && <button type="button" className="mp-admin-action danger" aria-label={`Archive ${course.title}`} title={`Archive ${course.title}`} onClick={() => setConfirming(course)}><Archive size={14} /></button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {error && <p className="mp-form-error mt-3" role="alert">{error}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mp-modal-content sm:max-w-xl">
          <DialogHeader><DialogTitle className="mp-dialog-title">{draft.id ? "Edit course" : "Create a course"}</DialogTitle><DialogDescription>Share a clear invitation to a learning path.</DialogDescription></DialogHeader>
          <form className="mp-form-stack" onSubmit={submit}>
            <div className="mp-field"><Label htmlFor="admin-course-title">Course title</Label><Input id="admin-course-title" required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div>
            <div className="mp-field"><Label htmlFor="admin-course-description">Description</Label><Textarea id="admin-course-description" maxLength={1200} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div>
            <div className="mp-form-grid">
              <div className="mp-field"><Label htmlFor="admin-course-price">Price</Label><Input id="admin-course-price" type="number" min={0} step="0.01" required value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></div>
              <div className="mp-field"><Label htmlFor="admin-course-currency">Currency code</Label><Input id="admin-course-currency" required minLength={3} maxLength={3} value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value.toUpperCase() })} /></div>
            </div>
            <label className="mp-check-row"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /> Available to members</label>
            {error && <p className="mp-form-error" role="alert">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="mp-btn-primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save course"} <Check size={14} /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(confirming)} onOpenChange={(openValue) => { if (!openValue) setConfirming(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="mp-dialog-title">Archive this course?</DialogTitle><DialogDescription><strong>{confirming?.title}</strong> will no longer appear in the member catalogue. This does not remove existing enrollment records.</DialogDescription></DialogHeader>
          {error && <p className="mp-form-error" role="alert">{error}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirming(null)}>Keep course</Button><Button variant="destructive" disabled={archive.isPending} onClick={() => void confirmArchive()}>{archive.isPending ? "Archiving…" : "Archive course"}</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type QuizDraft = {
  id?: string;
  title: string;
  description: string;
  course_id: string;
  is_active: boolean;
  questions: QuizQuestionDraft[];
};
function freshQuestion(): QuizQuestionDraft { return { prompt: "", choices: ["", ""], correct_index: 0 }; }
const blankQuiz = (): QuizDraft => ({ title: "", description: "", course_id: "", is_active: true, questions: [freshQuestion()] });

function QuizManagement({ quizzes, courses }: { quizzes: AdminQuiz[]; courses: Course[] }) {
  const save = useSaveAdminQuiz();
  const archive = useArchiveAdminQuiz();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<QuizDraft>(blankQuiz());
  const [confirming, setConfirming] = useState<AdminQuiz | null>(null);
  const [error, setError] = useState("");
  const activeCourses = courses.filter((course) => course.is_active);
  const courseName = (courseId: string) => courses.find((course) => course.id === courseId)?.title ?? "Course not found";

  function show(quiz?: AdminQuiz) {
    setError("");
    if (quiz) {
      setDraft({
        id: quiz.id,
        title: quiz.title ?? "",
        description: quiz.description ?? "",
        course_id: quiz.course_id,
        is_active: quiz.is_active,
        questions: [freshQuestion()],
      });
    } else {
      setDraft({ ...blankQuiz(), course_id: activeCourses[0]?.id ?? "" });
    }
    setOpen(true);
  }

  function updateQuestion(index: number, update: Partial<QuizQuestionDraft>) {
    setDraft((current) => ({ ...current, questions: current.questions.map((question, position) => position === index ? { ...question, ...update } : question) }));
  }

  function updateChoice(questionIndex: number, choiceIndex: number, value: string) {
    setDraft((current) => ({ ...current, questions: current.questions.map((question, position) => {
      if (position !== questionIndex) return question;
      return { ...question, choices: question.choices.map((choice, index) => index === choiceIndex ? value : choice) };
    }) }));
  }

  function addChoice(questionIndex: number) {
    setDraft((current) => ({ ...current, questions: current.questions.map((question, index) => index === questionIndex && question.choices.length < 8 ? { ...question, choices: [...question.choices, ""] } : question) }));
  }

  function removeChoice(questionIndex: number, choiceIndex: number) {
    setDraft((current) => ({ ...current, questions: current.questions.map((question, index) => {
      if (index !== questionIndex || question.choices.length <= 2) return question;
      const choices = question.choices.filter((_, choiceIndexValue) => choiceIndexValue !== choiceIndex);
      const correct_index = question.correct_index === choiceIndex ? 0 : question.correct_index > choiceIndex ? question.correct_index - 1 : question.correct_index;
      return { ...question, choices, correct_index };
    }) }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!draft.course_id) {
      setError("Choose a course for this quiz.");
      return;
    }
    if (!draft.questions.every((question) => question.prompt.trim() && question.choices.length >= 2 && question.choices.every((choice) => choice.trim()))) {
      setError("Complete every question and answer choice before saving.");
      return;
    }
    try {
      await save.mutateAsync({
        id: draft.id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        course_id: draft.course_id,
        is_active: draft.is_active,
        questions: draft.questions.map((question) => ({ prompt: question.prompt.trim(), choices: question.choices.map((choice) => choice.trim()), correct_index: question.correct_index })),
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this quiz.");
    }
  }

  async function confirmArchive() {
    if (!confirming) return;
    setError("");
    try {
      await archive.mutateAsync(confirming.id);
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive this quiz.");
    }
  }

  return (
    <section className="mp-admin-panel">
      <SectionHeading
        title="Quiz library"
        detail="Quizzes are linked to a course and are visible to enrolled members."
        action={<Button size="sm" className="mp-btn-primary mp-btn-small" onClick={() => show()} disabled={!activeCourses.length} title={!activeCourses.length ? "Add an active course first" : "Add quiz"}><Plus size={14} /> Add quiz</Button>}
      />
      {!quizzes.length ? (
        <EmptyState icon={CircleHelp} title="No quizzes yet" detail={activeCourses.length ? "Add a quiz to help members reflect on a course." : "Create an active course before adding a quiz."} action={activeCourses.length ? <Button className="mp-btn-primary" onClick={() => show()}>Create a quiz</Button> : undefined} />
      ) : (
        <div className="mp-admin-table-wrap">
          <table className="mp-admin-table">
            <thead><tr><th>Quiz</th><th>Course</th><th>Member visibility</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{quizzes.map((quiz) => (
              <tr key={quiz.id}>
                <td><strong>{quiz.title}</strong><div className="mt-1 max-w-sm truncate text-[12px] text-[#777777]">{quiz.description}</div></td>
                <td>{courseName(quiz.course_id)}</td>
                <td><StatusPill status={quiz.is_active ? "active" : "archived"} /></td>
                <td>{formatDate((quiz as AdminQuiz & { created_at?: string }).created_at)}</td>
                <td><div className="mp-admin-actions">
                  <button type="button" className="mp-admin-action" aria-label={`Edit ${quiz.title}`} title={`Edit ${quiz.title}`} onClick={() => show(quiz)}><Pencil size={14} /></button>
                  {quiz.is_active && <button type="button" className="mp-admin-action danger" aria-label={`Archive ${quiz.title}`} title={`Archive ${quiz.title}`} onClick={() => setConfirming(quiz)}><Archive size={14} /></button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {error && !open && <p className="mp-form-error mt-3" role="alert">{error}</p>}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="mp-modal-content sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="mp-dialog-title">{draft.id ? "Edit quiz" : "Create a quiz"}</DialogTitle>
            <DialogDescription>{draft.id ? "Question details are not included in this overview. Add the complete question set before saving; saving replaces the quiz’s questions." : "Create a short reflection connected to one of your courses."}</DialogDescription>
          </DialogHeader>
          <form className="mp-form-stack" onSubmit={submit}>
            <div className="mp-form-grid">
              <div className="mp-field"><Label htmlFor="admin-quiz-title">Quiz title</Label><Input id="admin-quiz-title" required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div>
              <div className="mp-field"><Label htmlFor="admin-quiz-course">Course</Label><select id="admin-quiz-course" required className="mp-select" value={draft.course_id} onChange={(event) => setDraft({ ...draft, course_id: event.target.value })}><option value="">Choose a course</option>{activeCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
            </div>
            <div className="mp-field"><Label htmlFor="admin-quiz-description">Description</Label><Textarea id="admin-quiz-description" maxLength={1200} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></div>
            <div className="flex items-center justify-between gap-3"><span className="mp-label">Questions</span><Button type="button" variant="outline" size="sm" className="mp-btn-small" onClick={() => setDraft((current) => ({ ...current, questions: [...current.questions, freshQuestion()] }))}><Plus size={13} /> Add question</Button></div>
            <div className="grid gap-3">
              {draft.questions.map((question, questionIndex) => (
                <fieldset className="mp-question-editor" key={questionIndex}>
                  <legend className="sr-only">Question {questionIndex + 1}</legend>
                  <div className="mp-question-editor-header"><span>Question {questionIndex + 1}</span>{draft.questions.length > 1 && <button className="mp-icon-button" type="button" aria-label={`Remove question ${questionIndex + 1}`} onClick={() => setDraft((current) => ({ ...current, questions: current.questions.filter((_, index) => index !== questionIndex) }))}><X size={14} /></button>}</div>
                  <div className="mp-field"><Label htmlFor={`quiz-prompt-${questionIndex}`}>Prompt</Label><Textarea id={`quiz-prompt-${questionIndex}`} required maxLength={1000} value={question.prompt} onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })} placeholder="What would you like members to reflect on?" /></div>
                  <div className="mt-3 flex items-center justify-between gap-3"><span className="mp-label">Answer choices <span className="font-normal text-[#929a92]">· mark the correct answer</span></span>{question.choices.length < 8 && <button type="button" className="text-[12px] font-bold text-[#DE3F20]" onClick={() => addChoice(questionIndex)}>Add choice</button>}</div>
                  {question.choices.map((choice, choiceIndex) => (
                    <div className="mp-question-choice" key={choiceIndex}>
                      <label className="mp-radio-label"><input type="radio" name={`correct-${questionIndex}`} checked={question.correct_index === choiceIndex} onChange={() => updateQuestion(questionIndex, { correct_index: choiceIndex })} aria-label={`Mark choice ${choiceIndex + 1} correct`} /> Correct</label>
                      <div className="flex gap-2"><Input required maxLength={300} aria-label={`Question ${questionIndex + 1}, choice ${choiceIndex + 1}`} placeholder={`Choice ${choiceIndex + 1}`} value={choice} onChange={(event) => updateChoice(questionIndex, choiceIndex, event.target.value)} />{question.choices.length > 2 && <button type="button" className="mp-icon-button" aria-label={`Remove choice ${choiceIndex + 1}`} onClick={() => removeChoice(questionIndex, choiceIndex)}><X size={13} /></button>}</div>
                    </div>
                  ))}
                </fieldset>
              ))}
            </div>
            <label className="mp-check-row"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /> Available to enrolled members</label>
            {error && <p className="mp-form-error" role="alert">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="mp-btn-primary" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save quiz"} <Check size={14} /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(confirming)} onOpenChange={(openValue) => { if (!openValue) setConfirming(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle className="mp-dialog-title">Archive this quiz?</DialogTitle><DialogDescription><strong>{confirming?.title}</strong> will no longer appear as an available quiz to members.</DialogDescription></DialogHeader>
          {error && <p className="mp-form-error" role="alert">{error}</p>}
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setConfirming(null)}>Keep quiz</Button><Button variant="destructive" disabled={archive.isPending} onClick={() => void confirmArchive()}>{archive.isPending ? "Archiving…" : "Archive quiz"}</Button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
