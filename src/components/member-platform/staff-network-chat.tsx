import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
type Group = { id: string; name: string; description: string };
type Message = { id: string; group_id: string; user_id: string; body: string; created_at: string };

export function StaffNetworkChat() {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const groups = useQuery({
    queryKey: ["staff-network-groups"],
    queryFn: async () => {
      const { data, error } = await db.from("network_groups").select("id,name,description").eq("is_active", true).order("name");
      if (error) throw error;
      return data as Group[];
    },
    refetchInterval: 20000,
  });
  const messages = useQuery({
    queryKey: ["staff-network-messages", selected],
    enabled: Boolean(selected),
    queryFn: async () => {
      const { data, error } = await db.from("network_group_messages").select("id,group_id,user_id,body,created_at").eq("group_id", selected).order("created_at", { ascending: true }).limit(100);
      if (error) throw error;
      return data as Message[];
    },
    refetchInterval: 5000,
  });
  useEffect(() => {
    if (!selected) return;
    const channel = supabase.channel("staff-network-" + selected).on("postgres_changes", { event: "*", schema: "public", table: "network_group_messages", filter: "group_id=eq." + selected }, () => void client.invalidateQueries({ queryKey: ["staff-network-messages", selected] })).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selected, client]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { error } = await db.from("network_group_messages").insert({ group_id: selected, user_id: user.id, body: draft.trim() });
    if (error) window.alert(error.message);
    else { setDraft(""); await client.invalidateQueries({ queryKey: ["staff-network-messages", selected] }); }
    setSending(false);
  }
  const active = groups.data?.find(group => group.id === selected);
  return <section className="mt-8 space-y-4">
    <div><p className="mp-kicker">COMMUNITY</p><h2 className="text-lg font-bold">Network conversations</h2><p className="mt-1 text-sm text-muted-foreground">Join the same conversations as members. Your replies are visible to everyone in the group.</p></div>
    {groups.isPending ? <p className="py-4 text-sm text-muted-foreground">Loading groups…</p> : groups.isError ? <p role="alert" className="py-4 text-sm text-destructive">Could not load network groups.</p> : !groups.data?.length ? <p className="py-4 text-sm text-muted-foreground">No active groups yet.</p> : <div className="grid gap-2 sm:grid-cols-2">{groups.data.map(group => <button key={group.id} type="button" onClick={() => setSelected(group.id)} className={`flex min-w-0 items-start gap-3 border-b py-3 text-left ${selected === group.id ? "text-[#DE3F20]" : ""}`}><UsersRound size={18} className="mt-1 shrink-0"/><span className="min-w-0"><strong className="block">{group.name}</strong><span className="text-sm text-muted-foreground">{group.description || "Community group"}</span></span><MessageCircle size={16} className="ml-auto mt-1 shrink-0"/></button>)}</div>}
    {active && <div className="min-w-0 border-t pt-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">{active.name}</h3><p className="text-xs text-muted-foreground">Shared group chat · staff and members</p></div><Button size="sm" variant="outline" onClick={() => setSelected(null)}>Close</Button></div>
      <div className="my-3 max-h-[50dvh] min-h-40 space-y-3 overflow-y-auto py-2" aria-live="polite">{messages.isPending ? <p className="text-sm text-muted-foreground">Loading messages…</p> : messages.isError ? <p className="text-sm text-destructive">Could not load messages.</p> : messages.data?.length ? messages.data.map(message => <article key={message.id} className="max-w-[92%] rounded-lg bg-[#f7f5ef] px-3 py-2"><p className="whitespace-pre-wrap break-words text-sm">{message.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{message.user_id === (supabase.auth.getUser() as any)?.id ? "You" : "Group member"} · {new Date(message.created_at).toLocaleString()}</p></article>) : <p className="py-6 text-center text-sm text-muted-foreground">Start the conversation.</p>}</div>
      <form onSubmit={send} className="flex min-w-0 gap-2"><Input value={draft} onChange={event => setDraft(event.target.value)} maxLength={3000} placeholder="Reply to everyone…" aria-label="Group message"/><Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Send message"><Send size={16}/></Button></form>
    </div>}
  </section>;
}
