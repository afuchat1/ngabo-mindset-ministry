import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Clock3,
  Headphones,
  MessageCircle,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
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
import { genderOptions, formatCoursePrice, displayName } from "@/lib/member-platform";
import type { MemberProfile, PublicQuizQuestion, SupportTicket } from "@/lib/member-platform";
import {
  useCreateMemberSupportTicket,
  useEnrollInFreeCourse,
  useMemberCourses,
  useMemberDashboard,
  useMemberQuiz,
  useMemberQuizzes,
  useMemberSupportTickets,
  useMarkMemberInboxTicketRead,
  useReplyToMemberSupportTicket,
  useSubmitMemberQuiz,
  useUpdateMemberProfile,
} from "./use-platform";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  MemberWelcome,
  MemberWorkspace,
  PageLink,
  SectionHeading,
  StatusPill,
} from "./shared";
import "./workspace.css";

type CourseListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  enrolled: boolean;
  checkoutAvailable: boolean;
};

function shortDate(value?: string | null) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function MemberPageFrame({
  active,
  pendingAccess = false,
  title,
  kicker,
  description,
  children,
}: {
  active: string;
  pendingAccess?: boolean;
  title: string;
  kicker: string;
  description?: string | undefined;
  children: ReactNode;
}) {
  return (
    <MemberWorkspace active={active} title={title} kicker={kicker} description={description} pendingAccess={pendingAccess}>
      {children}
    </MemberWorkspace>
  );
}

export function MemberDashboard() {
  const dashboard = useMemberDashboard();
  const courses = useMemberCourses();

  return (
    <MemberPageFrame
      active="/dashboard"
      title="Overview"
      kicker="MEMBER"
    >
      {dashboard.isPending ? (
        <LoadingState label="Loading your member overview" />
      ) : dashboard.isError ? (
        <ErrorState
          message={dashboard.error instanceof Error ? dashboard.error.message : undefined}
          onRetry={() => void dashboard.refetch()}
        />
      ) : (
        <>
          <MemberWelcome />
          <div className="mp-stat-grid mt-4" aria-label="Learning activity summary">
            <Stat icon={BookOpen} value={dashboard.data.counts.enrollments} label="Courses joined" />
            <Stat icon={CircleHelp} value={dashboard.data.counts.quizzes} label="Quizzes ready" warm />
            <Stat icon={MessageCircle} value={dashboard.data.counts.support} label="Open support" />
            <Stat icon={UsersRound} value={dashboard.data.counts.courses} label="Courses to explore" warm />
          </div>
          <div className="mp-two-column">
            <section>
              <SectionHeading
                title="A good place to begin"
                detail="Explore a course that meets you where you are."
                action={<PageLink to="/dashboard/courses">Browse all</PageLink>}
              />
              <div className="mp-panel">
                {courses.isPending ? (
                  <div className="grid gap-3" aria-label="Loading courses">
                    <div className="mp-skeleton h-11" />
                    <div className="mp-skeleton h-11" />
                    <div className="mp-skeleton h-11" />
                  </div>
                ) : courses.isError ? (
                  <div className="py-5 text-center">
                    <p className="text-xs text-[#879087]">Courses could not be shown.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => void courses.refetch()}>Retry</Button>
                  </div>
                ) : courses.data.length === 0 ? (
                  <p className="py-7 text-center text-xs text-[#879087]">New learning paths are being prepared.</p>
                ) : (
                  <div className="mp-course-list">
                    {courses.data.slice(0, 4).map((course, index) => (
                      <div className="mp-mini-course" key={course.id}>
                        <div className={`mp-course-mark ${index % 3 === 1 ? "mark-green" : index % 3 === 2 ? "mark-orange" : ""}`}>
                          <BookOpen size={18} />
                        </div>
                        <div className="mp-course-text">
                          <strong>{course.title}</strong>
                          <span>{course.enrolled ? "You’re enrolled" : formatCoursePrice(course.price, course.currency)}</span>
                        </div>
                        <ArrowRight className="mp-course-arrow" size={16} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
            <section>
              <SectionHeading title="A note for today" detail="Your learning is part of a larger journey." />
              <div className="mp-panel mp-journey-panel">
                <div className="mp-journey-icon"><Sparkles size={19} /></div>
                <h3>Keep a little room for discovery.</h3>
                <p>Every new idea can become a way to serve your community with more confidence and care.</p>
                <PageLink to="/dashboard/quizzes">See what’s ready</PageLink>
              </div>
            </section>
          </div>
          <section>
            <SectionHeading
              title="Your account"
              detail={`Welcome to the NGABO learning community, ${displayName(dashboard.data.profile)}.`}
              action={<PageLink to="/dashboard/profile">Review profile</PageLink>}
            />
            <div className="mp-panel flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="mp-journey-icon"><ShieldCheck size={18} /></div>
                <div>
                  <p className="m-0 text-xs font-bold text-[#43584a]">Your member space is ready</p>
                  <p className="mt-1 mb-0 text-[12px] text-[#8a948b]">Courses, quizzes, and personal support are all in one place.</p>
                </div>
              </div>
              <PageLink to="/dashboard/support">Talk to our team</PageLink>
            </div>
          </section>
        </>
      )}
    </MemberPageFrame>
  );
}

function Stat({ icon: Icon, value, label, warm = false }: { icon: typeof BookOpen; value: number; label: string; warm?: boolean }) {
  return (
    <div className="mp-stat-card">
      <div className={`mp-stat-icon ${warm ? "warm" : ""}`}><Icon size={18} /></div>
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  );
}

export function MemberCourses() {
  const query = useMemberCourses();
  const enroll = useEnrollInFreeCourse();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "joined" | "free" | "paid">("all");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const rows = (query.data ?? []) as CourseListing[];
  const filtered = useMemo(() => rows.filter((course) => {
    const termMatches = `${course.title} ${course.description}`.toLowerCase().includes(search.trim().toLowerCase());
    const filterMatches =
      filter === "all" ||
      (filter === "joined" && course.enrolled) ||
      (filter === "free" && course.price === 0) ||
      (filter === "paid" && course.price > 0);
    return termMatches && filterMatches;
  }), [rows, search, filter]);

  async function join(course: CourseListing) {
    setActionError("");
    setEnrollingId(course.id);
    try {
      await enroll.mutateAsync(course.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not join this course. Please try again.");
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <MemberPageFrame
      active="/dashboard/courses"
      title="Courses"
      kicker="LEARNING"
      description="Explore available courses and continue learning."
    >
      <div className="mp-filter-row">
        <div className="mp-tabs" role="tablist" aria-label="Filter courses">
          {([["all", "All courses"], ["joined", "Joined"], ["free", "Free"], ["paid", "Paid"]] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={filter === key} className="mp-tab" onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <label className="mp-search">
          <Search size={15} />
          <input aria-label="Search courses" placeholder="Find a course" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>
      {query.isPending ? (
        <LoadingState label="Loading courses" />
      ) : query.isError ? (
        <ErrorState message={query.error instanceof Error ? query.error.message : undefined} onRetry={() => void query.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={search ? "No courses match that search" : filter === "joined" ? "Your learning journey starts here" : "No courses in this view"}
          detail={search ? "Try a shorter search, or clear the search field to see every course." : "New opportunities to learn are being prepared by the NGABO team."}
          action={search ? <Button variant="outline" size="sm" onClick={() => setSearch("")}>Clear search</Button> : undefined}
        />
      ) : (
        <div className="mp-card-grid">
          {filtered.map((course, index) => (
            <article className="mp-learning-card" key={course.id}>
              <div className="mp-card-top">
                <span className="mp-card-type">{index % 2 === 0 ? "PERSONAL GROWTH" : "LEARNING PATH"}</span>
                <span className="mp-price">{formatCoursePrice(course.price, course.currency)}</span>
              </div>
              <h3>{course.title}</h3>
              <p>{course.description || "A practical learning experience created for the NGABO community."}</p>
              <div className="mp-card-bottom">
                <span className="mp-card-meta">{course.enrolled ? "Joined learning path" : course.price === 0 ? "Open to members" : "Checkout not available yet"}</span>
                {course.enrolled ? (
                  <span className="mp-status mp-status-approved"><Check size={12} /> Joined</span>
                ) : course.price === 0 ? (
                  <Button size="sm" className="mp-btn-primary mp-btn-small" disabled={enrollingId === course.id} onClick={() => void join(course)}>
                    {enrollingId === course.id ? "Joining…" : "Join free"}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="mp-btn-small" disabled title="Paid checkout is planned but not available yet">Coming soon</Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {actionError && <p className="mp-form-error mt-4" role="alert">{actionError}</p>}
      <div className="mt-5 rounded-xl border border-[#e8eadf] bg-[#f4f2e8] p-4 text-[12px] leading-6 text-[#758176]">
        <strong className="text-[#546550]">A note on paid courses</strong><br />
        Some learning paths may have a fee. Checkout is planned, and paid enrollment is not available yet. You can still join any course marked free.
      </div>
    </MemberPageFrame>
  );
}

type QuizListItem = {
  id: string;
  title: string;
  description: string;
  course_title: string;
};
type QuizAttempt = { id: string; quiz_id: string; score: number; total: number; submitted_at: string };
type QuizPageData = { quizzes: QuizListItem[]; attempts: QuizAttempt[] };
type QuizPayload = { questions?: PublicQuizQuestion[]; title?: string; description?: string } | PublicQuizQuestion[];
type QuizResult = { score?: number; total?: number; submitted_at?: string };

export function MemberQuizzes() {
  const query = useMemberQuizzes();
  const [selectedQuiz, setSelectedQuiz] = useState<QuizListItem | null>(null);
  const data = query.data as QuizPageData | undefined;

  if (selectedQuiz) {
    return <QuizTaking quiz={selectedQuiz} onBack={() => setSelectedQuiz(null)} />;
  }

  return (
    <MemberPageFrame
      active="/dashboard/quizzes"
      title="Quizzes"
      kicker="ASSESSMENT"
      description="Review your quizzes and results."
    >
      <SectionHeading title="Ready when you are" detail="Each quiz is a chance to revisit a useful idea." />
      {query.isPending ? (
        <LoadingState label="Loading quizzes" />
      ) : query.isError ? (
        <ErrorState message={query.error instanceof Error ? query.error.message : undefined} onRetry={() => void query.refetch()} />
      ) : !data?.quizzes.length ? (
        <EmptyState icon={CircleHelp} title="No quizzes are open yet" detail="When a quiz is added to a learning path, you’ll find it here." />
      ) : (
        <>
          <div className="mp-card-grid">
            {data.quizzes.map((quiz) => {
              const previous = data.attempts.find((attempt) => attempt.quiz_id === quiz.id);
              return (
                <article className="mp-learning-card" key={quiz.id}>
                  <div className="mp-card-top">
                    <span className="mp-card-type">{quiz.course_title}</span>
                    <span className="mp-card-meta">{previous ? "Attempted" : "Not started"}</span>
                  </div>
                  <h3>{quiz.title}</h3>
                  <p>{quiz.description || "Reflect on the ideas and practices from this course."}</p>
                  <div className="mp-card-bottom">
                    <span className="mp-card-meta">
                      {previous ? `Last result · ${previous.score} of ${previous.total}` : "Take your time"}
                    </span>
                    <Button size="sm" className="mp-btn-primary mp-btn-small" onClick={() => setSelectedQuiz(quiz)}>
                      {previous ? "Try again" : "Start quiz"} <ArrowRight size={13} />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          {data.attempts.length > 0 && (
            <section>
              <SectionHeading title="Your recent reflections" detail="Your latest quiz results." />
              <div className="mp-panel">
                {data.attempts.slice(0, 5).map((attempt) => {
                  const quiz = data.quizzes.find((item) => item.id === attempt.quiz_id);
                  return (
                    <div className="mp-mini-course" key={attempt.id}>
                      <div className="mp-course-mark mark-green"><Check size={17} /></div>
                      <div className="mp-course-text"><strong>{quiz?.title ?? "Learning reflection"}</strong><span>{shortDate(attempt.submitted_at)}</span></div>
                      <span className="mp-status mp-status-approved">{attempt.score} / {attempt.total}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </MemberPageFrame>
  );
}

function QuizTaking({ quiz, onBack }: { quiz: QuizListItem; onBack: () => void }) {
  const quizQuery = useMemberQuiz(quiz.id);
  const submit = useSubmitMemberQuiz();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState("");
  const raw = quizQuery.data as QuizPayload | null | undefined;
  const questions = useMemo(() => {
    const list = Array.isArray(raw) ? raw : raw?.questions ?? [];
    return [...list].sort((a, b) => a.position - b.position);
  }, [raw]);
  const answered = Object.keys(answers).length;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError("");
    try {
      const response = await submit.mutateAsync({ quiz_id: quiz.id, answers });
      setResult(response as QuizResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We couldn’t submit your answers. Try again.");
    }
  }

  return (
    <MemberPageFrame active="/dashboard/quizzes" title={quiz.title} kicker="QUIZ & REFLECT" description={quiz.course_title}>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-[#60766a]" onClick={onBack}><ArrowLeft size={15} /> All quizzes</Button>
      {quizQuery.isPending ? (
        <LoadingState label="Loading quiz questions" />
      ) : quizQuery.isError ? (
        <ErrorState title="This quiz isn’t available yet" message={quizQuery.error instanceof Error ? quizQuery.error.message : "Join its free course first, then come back to try again."} onRetry={() => void quizQuery.refetch()} />
      ) : result ? (
        <div className="mp-state-card">
          <div className="mp-state-symbol"><Sparkles size={21} /></div>
          <p className="mp-kicker mt-4">REFLECTION COMPLETE</p>
          <h2>You made space to learn.</h2>
          <p>Your result: <strong className="text-[#47654f]">{result.score ?? "—"} of {result.total ?? questions.length}</strong>. Take what was useful and keep going at your own pace.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button className="mp-btn-primary" onClick={() => { setResult(null); setAnswers({}); }}>Review again</Button>
            <Button variant="outline" onClick={onBack}>Back to quizzes</Button>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <EmptyState icon={CircleHelp} title="Questions are not ready" detail="The quiz has not been published with questions yet. Please check back later." action={<Button variant="outline" onClick={onBack}>Back to quizzes</Button>} />
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="mp-panel flex flex-wrap items-center justify-between gap-3">
            <div><p className="m-0 text-sm font-bold text-[#40574a]">{quiz.title}</p><p className="mt-1 mb-0 text-[12px] text-[#88938a]">{questions.length} {questions.length === 1 ? "question" : "questions"} · choose one answer for each</p></div>
            <span className="mp-status mp-status-open"><Clock3 size={12} /> At your own pace</span>
          </div>
          {questions.map((question, index) => (
            <fieldset className="mp-panel" key={question.id} aria-describedby={`quiz-q-${question.id}`}>
              <legend id={`quiz-q-${question.id}`} className="mb-3 max-w-full text-xs font-bold leading-6 text-[#3c5145]">
                <span className="mr-2 text-[#c16a46]">0{index + 1}</span>{question.prompt}
              </legend>
              <div className="grid gap-2">
                {question.choices.map((choice, choiceIndex) => (
                  <label key={`${question.id}-${choiceIndex}`} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 text-[12px] leading-5 transition-colors ${answers[question.id] === choiceIndex ? "border-[#93ae96] bg-[#f1f6ee] text-[#3f5d48]" : "border-[#e8ebe4] bg-[#fffefa] text-[#718078] hover:bg-[#f7f9f4]"}`}>
                    <input type="radio" name={question.id} value={choiceIndex} checked={answers[question.id] === choiceIndex} onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))} className="mt-1 accent-[#315c4c]" />
                    <span>{choice}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {submitError && <p role="alert" className="mp-form-error">{submitError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] text-[#89948a]">{answered} of {questions.length} answered</span>
            <Button className="mp-btn-primary" disabled={answered !== questions.length || submit.isPending}>
              {submit.isPending ? "Sending answers…" : "Submit reflection"} <Send size={14} />
            </Button>
          </div>
        </form>
      )}
    </MemberPageFrame>
  );
}

type SupportTicketWithMessages = SupportTicket & {
  messages: Array<{ id: string; sender_role: string; body: string; created_at: string }>;
};

export function MemberSupport({ pendingAccess = false }: { pendingAccess?: boolean } = {}) {
  const query = useMemberSupportTickets();
  const create = useCreateMemberSupportTicket();
  const reply = useReplyToMemberSupportTicket();
  const markInboxTicketRead = useMarkMemberInboxTicketRead();
  const [createOpen, setCreateOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");
  const tickets = (query.data ?? []) as SupportTicketWithMessages[];
  const active = tickets.find((ticket) => ticket.id === activeId) ?? null;

  useEffect(() => {
    if (!active?.id) return;
    void markInboxTicketRead.mutateAsync(active.id).catch(() => undefined);
  }, [active?.id]);

  async function createTicket(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await create.mutateAsync({ subject, message });
      setSubject("");
      setMessage("");
      setCreateOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your support request.");
    }
  }

  async function sendReply(event: FormEvent) {
    event.preventDefault();
    if (!active || !replyText.trim()) return;
    setError("");
    try {
      await reply.mutateAsync({ ticket_id: active.id, message: replyText.trim() });
      setReplyText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your reply.");
    }
  }

  return (
    <MemberPageFrame
      pendingAccess={pendingAccess}
      active="/dashboard/support"
      title="Member support"
      kicker="SUPPORT"
      description="Contact the NGABO team and follow your requests."
    >
      <SectionHeading
        title="Your conversations"
        detail="A member of our team will reply here."
        action={<Button size="sm" className="mp-btn-primary mp-btn-small" onClick={() => { setError(""); setCreateOpen(true); }}><MessageCircle size={14} /> New request</Button>}
      />
      {query.isPending ? (
        <LoadingState label="Loading support conversations" />
      ) : query.isError ? (
        <ErrorState message={query.error instanceof Error ? query.error.message : undefined} onRetry={() => void query.refetch()} />
      ) : tickets.length === 0 ? (
        <div className="mp-panel">
          <EmptyState icon={Headphones} title="No conversations yet" detail="If you need guidance, start a conversation. We’ll be glad to help." action={<Button className="mp-btn-primary" onClick={() => setCreateOpen(true)}>Contact the team</Button>} />
        </div>
      ) : (
        <div className="mp-support-layout">
          <div className="mp-panel">
            <div className="mp-panel-title"><div><h3>Recent requests</h3><p>{tickets.length} conversation{tickets.length === 1 ? "" : "s"}</p></div></div>
            <div className="mp-ticket-list">
              {tickets.map((ticket) => (
                <button type="button" key={ticket.id} className={`mp-ticket-row ${active?.id === ticket.id ? "is-selected" : ""}`} onClick={() => { setActiveId(ticket.id); setError(""); }}>
                  <strong>{ticket.subject}</strong>
                  <span className="font-mono text-xs font-semibold tracking-wide text-[#a84f36]">#{String(ticket.ticket_number).padStart(6, "0")}</span>
                  <span>{ticket.messages?.length ?? 0} messages · {shortDate(ticket.updated_at)}</span>
                  <span className="mt-2"><StatusPill status={ticket.status} /></span>
                </button>
              ))}
            </div>
          </div>
          {active ? (
            <section className="mp-panel mp-ticket-detail">
              <div className="mp-panel-title">
                <div><h3>{active.subject}</h3><p><span className="font-mono font-semibold text-[#a84f36]">#{String(active.ticket_number).padStart(6, "0")}</span> · Opened {shortDate(active.created_at)}</p></div>
                <StatusPill status={active.status} />
              </div>
              <div className="mp-message-list" aria-live="polite">
                {active.messages?.length ? active.messages.map((item) => (
                  <div key={item.id} className={`mp-message ${item.sender_role === "admin" || item.sender_role === "staff" ? "is-staff" : ""}`}>
                    <div className="mp-message-meta"><strong>{item.sender_role === "admin" || item.sender_role === "staff" ? "NGABO team" : "You"}</strong><span>{shortDate(item.created_at)}</span></div>
                    <p>{item.body}</p>
                  </div>
                )) : <p className="py-8 text-center text-xs text-[#88938a]">Your conversation is ready. Send a reply below to add a detail.</p>}
              </div>
              {active.status === "resolved" ? (
                <div className="rounded-lg bg-[#f3f5ef] p-3 text-[12px] text-[#738078]">This conversation is marked resolved. If you still need help, you can open a new request.</div>
              ) : (
                <form className="mp-inline-form" onSubmit={sendReply}>
                  <div className="mp-field"><Label htmlFor="member-support-reply">Continue the conversation</Label><Textarea id="member-support-reply" required maxLength={5000} placeholder="Write a reply…" value={replyText} onChange={(event) => setReplyText(event.target.value)} /></div>
                  <Button className="mp-btn-primary" size="icon" aria-label="Send reply" disabled={reply.isPending || !replyText.trim()}><Send size={15} /></Button>
                </form>
              )}
            </section>
          ) : (
            <section className="mp-panel mp-ticket-detail mp-ticket-detail-empty">
              <div className="mp-panel-title"><div><h3>Your conversation</h3><p>Choose a request to read its messages.</p></div></div>
              <p className="py-8 text-center text-xs text-[#88938a]">Select a conversation from the list to open it. New team replies will remain unread until you open that conversation.</p>
            </section>
          )}
        </div>
      )}
      {error && <p className="mp-form-error mt-4" role="alert">{error}</p>}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="mp-modal-content sm:max-w-lg">
          <DialogHeader><DialogTitle className="mp-dialog-title">Start a conversation</DialogTitle><DialogDescription>Share a little context so our team can support you well.</DialogDescription></DialogHeader>
          <form className="mp-form-stack" onSubmit={createTicket}>
            <div className="mp-field"><Label htmlFor="support-subject">Subject</Label><Input id="support-subject" required minLength={1} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="What can we help with?" /></div>
            <div className="mp-field"><Label htmlFor="support-message">Message</Label><Textarea id="support-message" required maxLength={5000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Add the details our team should know…" /></div>
            {error && <p className="mp-form-error" role="alert">{error}</p>}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button className="mp-btn-primary" disabled={create.isPending}>{create.isPending ? "Sending…" : "Send request"} <Send size={14} /></Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </MemberPageFrame>
  );
}

type ProfileForm = {
  first_name: string;
  last_name: string;
  phone: string;
  country: string;
  age: string;
  gender: string;
};

export function MemberProfile() {
  const query = useMemberDashboard();
  const update = useUpdateMemberProfile();
  const initialized = useRef<string | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    first_name: "", last_name: "", phone: "", country: "", age: "", gender: "prefer_not_to_say",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const profile = query.data?.profile as MemberProfile | undefined;

  useEffect(() => {
    if (!profile || initialized.current === profile.user_id) return;
    initialized.current = profile.user_id;
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
      age: profile.age == null ? "" : String(profile.age),
      gender: profile.gender ?? "prefer_not_to_say",
    });
  }, [profile]);

  function change(field: keyof ProfileForm, value: string) {
    setSaved(false);
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaved(false);
    setError("");
    try {
      await update.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        age: Number(form.age),
        gender: form.gender as "female" | "male" | "non_binary" | "other" | "prefer_not_to_say",
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile. Please try again.");
    }
  }

  return (
    <MemberPageFrame
      active="/dashboard/profile"
      title="My profile"
      kicker="PROFILE"
    >
      {query.isPending ? (
        <LoadingState label="Loading your profile" />
      ) : query.isError ? (
        <ErrorState message={query.error instanceof Error ? query.error.message : undefined} onRetry={() => void query.refetch()} />
      ) : profile ? (
        <div className="mp-profile-card">
          <aside className="mp-profile-aside">
            <div className="mp-profile-avatar">{`${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase() || "N"}</div>
            <h2>{displayName(profile)}</h2>
            <p>{profile.email}</p>
            <div className="mt-5"><StatusPill status={profile.approval_status} /></div>
            <hr className="mp-divider" />
            <div className="mp-info-row"><span>Email verification</span><strong>{profile.email_verified_at ? "Verified" : "Not verified"}</strong></div>
            <div className="mp-info-row"><span>Member access</span><strong>{profile.approval_status === "approved" ? "Active" : "Under review"}</strong></div>
            <p className="mt-4">Your email address is managed with your sign-in account and cannot be changed here.</p>
          </aside>
          <form onSubmit={save} className="mp-form-stack">
            <div className="mp-panel-title mb-0"><div><h3>Personal information</h3><p>Only share what helps us serve you better.</p></div></div>
            <div className="mp-form-grid">
              <div className="mp-field"><Label htmlFor="profile-first">First name</Label><Input id="profile-first" required maxLength={100} value={form.first_name} onChange={(event) => change("first_name", event.target.value)} /></div>
              <div className="mp-field"><Label htmlFor="profile-last">Last name</Label><Input id="profile-last" required maxLength={100} value={form.last_name} onChange={(event) => change("last_name", event.target.value)} /></div>
              <div className="mp-field"><Label htmlFor="profile-phone">Phone number</Label><Input id="profile-phone" type="tel" required maxLength={40} value={form.phone} onChange={(event) => change("phone", event.target.value)} /></div>
              <div className="mp-field"><Label htmlFor="profile-country">Country</Label><Input id="profile-country" required maxLength={100} value={form.country} onChange={(event) => change("country", event.target.value)} /></div>
              <div className="mp-field"><Label htmlFor="profile-age">Age</Label><Input id="profile-age" type="number" min={1} max={120} required value={form.age} onChange={(event) => change("age", event.target.value)} /></div>
              <div className="mp-field"><Label htmlFor="profile-gender">Gender</Label><select id="profile-gender" className="mp-select" value={form.gender} onChange={(event) => change("gender", event.target.value)}>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            </div>
            {error && <p className="mp-form-error" role="alert">{error}</p>}
            {saved && <p className="mp-form-success" role="status">Your profile has been saved.</p>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9ece5] pt-4">
              <p className="m-0 text-[12px] text-[#929a92]">Your details are only used to support your member experience.</p>
              <Button className="mp-btn-primary" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"} <Check size={14} /></Button>
            </div>
          </form>
        </div>
      ) : null}
    </MemberPageFrame>
  );
}
