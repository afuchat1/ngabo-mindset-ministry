import { describe, expect, it } from 'vitest';
import { assertAdmin, eventDisplayState, eventSchema, isEventActive, kampalaTimestamp, type EventRecord } from '@/lib/events';

const event: EventRecord = { id: 'test', title: 'Counseling', schedule_text: '', icon: 'mountain', destination_url: 'https://example.com/event', starts_at: '2026-11-09T10:00:00Z', ends_at: '2026-11-09T11:00:00Z' };
describe('Ngabo event rules', () => {
  it('does not show events before the display start', () => { expect(isEventActive(event, Date.parse('2026-11-09T09:59:59Z'))).toBe(false); });
  it('shows events exactly at the display start', () => { expect(isEventActive(event, Date.parse('2026-11-09T10:00:00Z'))).toBe(true); });
  it('removes events completely at the end', () => { expect(eventDisplayState([event], Date.parse('2026-11-09T11:00:00Z')).visible).toBe(false); });
  it('hides the entire card when there are no events', () => { expect(eventDisplayState([]).visible).toBe(false); });
  it('keeps three active rows without scrolling and scrolls at four', () => { const now = Date.parse('2026-11-09T10:30:00Z'); expect(eventDisplayState(Array(3).fill(event), now).scrollable).toBe(false); expect(eventDisplayState(Array(4).fill(event), now).scrollable).toBe(true); });
  it('only administrators can manage events', () => { expect(() => assertAdmin(false)).toThrow('Administrator access required'); expect(() => assertAdmin(null)).toThrow(); expect(() => assertAdmin(true)).not.toThrow(); });
  it('retains destination links and rejects unsafe schemes', () => { const data = { ...event, id: undefined }; expect(eventSchema.parse(data).destination_url).toBe('https://example.com/event'); expect(eventSchema.safeParse({ ...data, destination_url: 'javascript:alert(1)' }).success).toBe(false); });
  it('requires end after start', () => { expect(eventSchema.safeParse({ ...event, id: undefined, ends_at: event.starts_at }).success).toBe(false); });
  it('converts Kampala schedule to UTC', () => { expect(kampalaTimestamp(new Date(2026, 10, 9), '13:08')).toBe('2026-11-09T10:08:00.000Z'); });
});