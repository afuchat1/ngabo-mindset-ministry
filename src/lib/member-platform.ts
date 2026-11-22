import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';

export const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export const memberProfileSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your first name').max(100),
  last_name: z.string().trim().min(1, 'Enter your last name').max(100),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(40),
  country: z.string().trim().min(2, 'Enter your country').max(100),
  age: z.coerce.number().int().min(1).max(120),
  gender: z.enum(['female', 'male', 'non_binary', 'other', 'prefer_not_to_say']),
});

export const signupSchema = memberProfileSchema.extend({
  email: z.string().trim().email().max(254),
  password: z.string().min(10, 'Use at least 10 characters').max(128),
});

export const courseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1200),
  price: z.coerce.number().min(0).max(999999999),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/),
  is_active: z.boolean(),
});

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
  choices: z.array(z.string().trim().min(1).max(300)).min(2).max(8),
  correct_index: z.number().int().min(0).max(7),
}).refine(question => question.correct_index < question.choices.length, {
  message: 'Choose a correct answer from the options',
  path: ['correct_index'],
});

export const quizSchema = z.object({
  id: z.string().uuid().optional(),
  course_id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1200),
  is_active: z.boolean(),
  questions: z.array(quizQuestionSchema).min(1).max(100),
});

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
});

export const supportReplySchema = z.object({
  ticket_id: z.string().uuid(),
  message: z.string().trim().min(1).max(5000),
  resolve: z.boolean().optional(),
});

export type MemberProfile = Tables<'member_profiles'>;
export type Course = Tables<'courses'>;
export type Quiz = Tables<'quizzes'>;
export type SupportTicket = Tables<'support_tickets'>;
export type SupportMessage = Tables<'support_messages'>;

export type PublicQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
  position: number;
};

export function displayName(profile: Pick<MemberProfile, 'first_name' | 'last_name'>) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() || 'Member';
}

export function formatCoursePrice(price: number, currency: string) {
  if (price === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

export function assertApprovedProfile(profile: Pick<MemberProfile, 'approval_status' | 'email_verified_at'> | null) {
  if (!profile?.email_verified_at) throw new Error('Verify your email address before continuing.');
  if (profile.approval_status !== 'approved') throw new Error('Your account is awaiting administrator approval.');
}
