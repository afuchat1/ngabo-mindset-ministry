import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LifeBuoy, LogOut, MessageCircle, Send, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getSupportTeamDashboard, replyToSupportTeamTicket, type SupportTeamTicket } from "@/lib/member-platform.functions";
import logoImage from "@/assets/ngabo-logo.jpg";
import "./workspace.css";
import { StaffNetworkChat } from "./staff-network-chat";

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function SupportTeamDashboard() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["support-team", "tickets"], queryFn: () => getSupportTeamDashboard(), refetchInterval: 15000 });
  const reply = useMutation({
    mutationFn: (input: { ticket_id: string; message: string; resolve: boolean }) => replyToSupportTeamTicket({ data: input }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ["support-team", "tickets"] }); },
  });
  const tickets = (query.data ?? []) as SupportTeamTicket[];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [resolve, setResolve] = useState(false);
  const [error, setError] = useState("");
  const active = tickets.find(ticket => ticket.id === selectedId) ?? tickets[0] ?? null;
  const openCount = tickets.filter(ticket => ticket.status !== "resolved").length;

  async function signOut() {
    await client.cancelQueries();
    client.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }
  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active || !message.trim()) return;
    setError("");
    try {
      await reply.mutateAsync({ ticket_id: active.id, message: message.trim(), resolve });
      setMessage("");
      setResolve(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your reply.");
    }
  }

  return <main className="mp-admin-shell min-h-screen">
    <header className="ngabo-admin-header"><div className="ngabo-admin-header-inner">
      <Link to="/" aria-label="NGABO home" className="inline-flex items-center"><img src={logoImage} alt="NGABO (MMA)" className="mp-brand-logo mp-brand-logo-events" /></Link>
      <div className="ngabo-admin-header-actions"><span className="text-sm font-semibold text-[#DE3F20]">Support team</span><Button className="ngabo-admin-signout" variant="outline" onClick={signOut}><LogOut />Sign out</Button></div>
    </div></header>
    <div className="mp-admin-inner">
      <div className="mp-admin-title"><div><p className="mp-kicker">NGABO SUPPORT</p><h1>Support workspace</h1><p className="mt-2 text-sm text-muted-foreground">Manage member requests and continue conversations.</p></div></div>
      <div className="mp-admin-stats">
        <div className="mp-admin-stat"><div className="mb-2 flex items-center justify-between"><span>All requests</span><LifeBuoy size={15} /></div><strong>{tickets.length}</strong></div>
        <div className="mp-admin-stat"><div className="mb-2 flex items-center justify-between"><span>Needs attention</span><MessageCircle size={15} /></div><strong>{openCount}</strong></div>
        <div className="mp-admin-stat"><div className="mb-2 flex items-center justify-between"><span>Resolved</span><CheckCircle2 size={15} /></div><strong>{tickets.length-openCount}</strong></div>
      </div>
      {query.isPending ? <div className="py-16 text-center text-sm text-muted-foreground">Loading support requests…</div>
      : query.isError ? <div role="alert" className="py-12 text-center"><p className="font-semibold">Support requests could not be loaded.</p><p className="mt-2 text-sm text-muted-foreground">{query.error instanceof Error ? query.error.message : "Try again."}</p><Button className="mt-4" variant="outline" onClick={()=>void query.refetch()}><RefreshCw size={15}/>Try again</Button></div>
      : !tickets.length ? <div className="mp-empty-state"><LifeBuoy size={28}/><h3>No support requests yet</h3><p>New member requests will appear here.</p></div>
      : <div className="mp-ticket-admin">
        <div className="mp-ticket-list">{tickets.map(ticket=><button key={ticket.id} type="button" className={`mp-ticket-row ${active?.id===ticket.id?"is-selected":""}`} onClick={()=>{setSelectedId(ticket.id);setError("");}}>
          <strong>{ticket.subject}</strong><span className="font-mono text-xs font-semibold text-[#DE3F20]">#{String(ticket.ticket_number).padStart(6,"0")}</span>
          <span>{[ticket.member.first_name,ticket.member.last_name].filter(Boolean).join(" ") || "Member"} · {dateLabel(ticket.updated_at)}</span>
          <span className="mt-2"><span className={`mp-status mp-status-${ticket.status.replaceAll("_","-")}`}>{ticket.status.replaceAll("_"," ")}</span></span>
        </button>)}</div>
        {active && <section className="mp-panel mp-ticket-admin-detail">
          <div className="mp-panel-title"><div><h3>{active.subject}</h3><p>#{String(active.ticket_number).padStart(6,"0")} · {[active.member.first_name,active.member.last_name].filter(Boolean).join(" ") || "Member"} · {active.member.email}</p></div><span className={`mp-status mp-status-${active.status.replaceAll("_","-")}`}>{active.status.replaceAll("_"," ")}</span></div>
          <div className="mp-message-list">{active.messages.map(item=><article key={item.id} className={`mp-message ${item.sender_role!=="member"?"is-staff":""}`}>
            <div className="mp-message-meta"><strong>{item.sender_role==="member"?"Member":"NGABO support"}</strong><span>{dateLabel(item.created_at)}</span></div><p>{item.body}</p>
          </article>)}</div>
          {active.status === "resolved" ? (
            <p className="rounded-lg bg-[#f3f5ef] p-3 text-[12px] text-[#738078]">This ticket is closed. No further messages can be sent. If more help is needed, the member must open a new request.</p>
          ) : (
            <form className="grid gap-3" onSubmit={sendReply}>
              <div className="mp-field"><Label htmlFor="support-team-reply">Your reply</Label><Textarea id="support-team-reply" required maxLength={5000} placeholder="Write a helpful response…" value={message} onChange={event=>setMessage(event.target.value)}/></div>
              <label className="mp-check-row"><input type="checkbox" checked={resolve} onChange={event=>setResolve(event.target.checked)}/> Mark resolved after replying</label>
              {error && <p role="alert" className="mp-form-error">{error}</p>}
              <div className="flex justify-end"><Button className="mp-btn-primary mp-btn-small" disabled={reply.isPending || !message.trim()}>{reply.isPending?"Sending…":"Send reply"} <Send size={14}/></Button></div>
            </form>
          )}
        </section>}
      </div>}
      <StaffNetworkChat />
      <footer className="mp-footer"><span>NGABO (MMA) · Support workspace</span></footer>
    </div>
  </main>;
}
