import { Mountain, Palmtree, Store, CalendarDays, Radio, Users, Church, BookOpen, Heart, Mic } from 'lucide-react';

const icons = { mountain: Mountain, palm: Palmtree, store: Store, calendar: CalendarDays, radio: Radio, users: Users, church: Church, book: BookOpen, heart: Heart, mic: Mic };
export function EventIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name as keyof typeof icons] ?? CalendarDays;
  return <Icon className={className} aria-hidden="true" />;
}