import { useEffect, useState } from 'react';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { listActiveEvents } from '@/lib/events.functions';
import { eventDisplayState } from '@/lib/events';
import { EventIcon } from './event-icon';

export const activeEventsOptions = queryOptions({ queryKey: ['public-events'], queryFn: () => listActiveEvents(), refetchInterval: 15000, staleTime: 0 });
export function EventsCard() {
  const { data } = useSuspenseQuery(activeEventsOptions);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 1000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);
  const { active, visible, scrollable } = eventDisplayState(data, now);
  if (!visible) return null;
  return <aside aria-label="Ngabo's events" className="mt-8 w-full max-w-2xl overflow-hidden rounded-lg border border-primary/25 bg-card text-left shadow-sm">
    <h2 className="border-b bg-muted px-5 py-4 text-lg font-extrabold text-primary">Ngabo's events!</h2>
    <div tabIndex={scrollable ? 0 : undefined} aria-label={scrollable ? 'Scroll events' : undefined} className={`divide-y ${scrollable ? 'max-h-72 overflow-y-auto overscroll-contain' : ''}`}>
      {active.map(event => <a key={event.id} href={event.destination_url ?? undefined} target="_blank" rel="noopener noreferrer" className="flex h-24 items-center gap-4 px-5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
        <EventIcon name={event.icon} className="size-7 shrink-0 text-primary" />
        <div className="min-w-0 flex-1"><p className="truncate font-bold">{event.title}</p><p className="truncate text-xs text-muted-foreground">{event.schedule_text}</p><span className="text-xs font-semibold text-primary">Read more</span></div>
        <ArrowUpRight className="size-4 shrink-0 text-primary" />
      </a>)}
    </div>
  </aside>;
}