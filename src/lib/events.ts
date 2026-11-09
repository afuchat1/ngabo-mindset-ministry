import { z } from 'zod';

export const eventIcons = ['mountain', 'palm', 'store', 'calendar', 'radio', 'users', 'church', 'book', 'heart', 'mic'] as const;
export const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  schedule_text: z.string().trim().max(180),
  icon: z.enum(eventIcons),
  destination_url: z.string().url().refine(value => /^https?:\/\//i.test(value), 'Use an HTTP or HTTPS link'),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
}).refine(value => Date.parse(value.ends_at) > Date.parse(value.starts_at), { message: 'End must be after start', path: ['ends_at'] });

export type EventRecord = { id: string; title: string; schedule_text: string; icon: string; destination_url: string | null; starts_at: string | null; ends_at: string | null };
export function isEventActive(event: EventRecord, now = Date.now()) {
  return Boolean(event.destination_url && event.starts_at && event.ends_at && Date.parse(event.starts_at) <= now && now < Date.parse(event.ends_at));
}
export function eventDisplayState(events: EventRecord[], now = Date.now()) {
  const active = events.filter(event => isEventActive(event, now));
  return { active, visible: active.length > 0, scrollable: active.length > 3 };
}
export function assertAdmin(allowed: boolean | null) {
  if (allowed !== true) throw new Error('Administrator access required');
}

export function kampalaTimestamp(date: Date, time: string) {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return new Date(`${day}T${time}:00+03:00`).toISOString();
}