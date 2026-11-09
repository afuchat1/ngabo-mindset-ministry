import { format } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function EventDatePicker({ label, value, onChange }: { label: string; value?: Date | undefined; onChange: (date: Date | undefined) => void }) {
  return <Popover><PopoverTrigger asChild><Button type="button" variant="outline" aria-label={label} className="w-full justify-start"><CalendarDays />{value ? format(value, 'dd MMM yyyy') : label}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={value} onSelect={onChange} captionLayout="dropdown" className="pointer-events-auto" /></PopoverContent></Popover>;
}