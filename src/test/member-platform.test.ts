import { describe, expect, it } from 'vitest';
import {
  assertApprovedProfile,
  courseSchema,
  displayName,
  formatCoursePrice,
  quizSchema,
  signupSchema,
} from '@/lib/member-platform';

const signup = {
  first_name: 'Amina',
  last_name: 'Nabirye',
  email: 'amina@example.com',
  phone: '+256700000000',
  country: 'Uganda',
  age: '28',
  gender: 'female',
  password: 'a-secure-password',
};

describe('member platform rules', () => {
  it('validates the required registration fields and password length', () => {
    expect(signupSchema.parse(signup).age).toBe(28);
    expect(signupSchema.safeParse({ ...signup, age: '0' }).success).toBe(false);
    expect(signupSchema.safeParse({ ...signup, password: 'short' }).success).toBe(false);
    expect(signupSchema.safeParse({ ...signup, email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts priced courses but rejects negative prices and invalid currencies', () => {
    expect(courseSchema.parse({
      title: 'Leadership foundations',
      description: 'An introduction to practical leadership.',
      price: 25000,
      currency: 'UGX',
      is_active: true,
    }).price).toBe(25000);
    expect(courseSchema.safeParse({
      title: 'Leadership foundations',
      description: '',
      price: -1,
      currency: 'UGX',
      is_active: true,
    }).success).toBe(false);
    expect(courseSchema.safeParse({
      title: 'Leadership foundations',
      description: '',
      price: 10,
      currency: 'ug',
      is_active: true,
    }).success).toBe(false);
  });

  it('requires a valid answer index for every quiz question', () => {
    const quiz = {
      course_id: '97aabf18-691f-4fe3-ad95-4706fe604729',
      title: 'Foundations quiz',
      description: '',
      is_active: true,
      questions: [{ prompt: 'Which comes first?', choices: ['Plan', 'Review'], correct_index: 0 }],
    };
    expect(quizSchema.safeParse(quiz).success).toBe(true);
    expect(quizSchema.safeParse({
      ...quiz,
      questions: [{ ...quiz.questions[0], correct_index: 2 }],
    }).success).toBe(false);
  });

  it('formats names, labels free courses, and blocks unverified or unapproved access', () => {
    expect(displayName({ first_name: 'Amina', last_name: 'Nabirye' })).toBe('Amina Nabirye');
    expect(formatCoursePrice(0, 'UGX')).toBe('Free');
    expect(() => assertApprovedProfile({ approval_status: 'pending', email_verified_at: '2026-11-22T00:00:00Z' })).toThrow('awaiting administrator approval');
    expect(() => assertApprovedProfile({ approval_status: 'approved', email_verified_at: null })).toThrow('Verify your email');
  });
});
