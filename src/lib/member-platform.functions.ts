import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { assertAdmin } from '@/lib/events';
import {
  courseSchema,
  memberProfileSchema,
  quizSchema,
  supportReplySchema,
  supportTicketSchema,
  type Course,
  type MemberProfile,
  type SupportMessage,
  type SupportTicket,
} from '@/lib/member-platform';
import { sendPlatformEmail, sendSupportTeamEmail } from '@/lib/platform-email';

async function loadProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error('Could not load member profile.');
  return data as MemberProfile | null;
}

async function requireAdmin(context: any) {
  const { data, error } = await context.supabase.rpc('has_role', {
    _user_id: context.userId,
    _role: 'admin',
  });
  assertAdmin(!error && data === true);
}

async function requireApprovedMember(context: any) {
  const profile = await loadProfile(context.supabase, context.userId);
  if (!profile?.email_verified_at) throw new Error('Verify your email address before continuing.');
  if (profile.approval_status !== 'approved') {
    throw new Error('Your account is awaiting administrator approval.');
  }
  return profile;
}

async function getDeliveryAddress(supabase: any, userId: string) {
  const profile = await loadProfile(supabase, userId);
  return profile?.email || '';
}

export const getMemberDashboard = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const profile = await requireApprovedMember(context);
    const [courses, enrollments, quizzes, tickets] = await Promise.all([
      context.supabase.from('courses').select('id').eq('is_active', true),
      context.supabase.from('course_enrollments').select('id').eq('user_id', context.userId),
      context.supabase.from('quizzes').select('id').eq('is_active', true),
      context.supabase.from('support_tickets').select('id,status').eq('user_id', context.userId),
    ]);
    if (
      courses.error || !courses.data
      || enrollments.error || !enrollments.data
      || quizzes.error || !quizzes.data
      || tickets.error || !tickets.data
    ) throw new Error('Could not load dashboard summary.');
    return {
      profile,
      counts: {
        courses: courses.data.length,
        enrollments: enrollments.data.length,
        quizzes: quizzes.data.length,
        support: tickets.data.filter(ticket => ticket.status !== 'resolved').length,
      },
    };
  });

export const updateMemberProfile = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => memberProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const profile = await loadProfile(context.supabase, context.userId);
    if (!profile) throw new Error('Member profile not found.');
    const result = await context.supabase.rpc('update_member_profile', {
      p_first_name: data.first_name,
      p_last_name: data.last_name,
      p_phone: data.phone,
      p_country: data.country,
      p_age: data.age,
      p_gender: data.gender,
    });
    if (result.error) throw new Error('Could not save your profile.');
    return result.data;
  });

export const getMemberCourses = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireApprovedMember(context);
    const [courseResult, enrollmentResult] = await Promise.all([
      context.supabase.from('courses').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      context.supabase.from('course_enrollments').select('course_id').eq('user_id', context.userId),
    ]);
    if (courseResult.error || enrollmentResult.error) throw new Error('Could not load courses.');
    const enrolledIds = new Set(enrollmentResult.data.map(row => row.course_id));
    return (courseResult.data as Course[]).map(course => ({
      ...course,
      enrolled: enrolledIds.has(course.id),
      checkoutAvailable: false,
    }));
  });

export const enrollInFreeCourse = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ course_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireApprovedMember(context);
    const { data: existing, error: existingError } = await context.supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', context.userId)
      .eq('course_id', data.course_id)
      .maybeSingle();
    if (existingError) throw new Error('Could not check your enrollment.');
    if (existing) return { enrolled: true, alreadyEnrolled: true };

    const { error } = await context.supabase.from('course_enrollments').insert({
      user_id: context.userId,
      course_id: data.course_id,
    });
    if (error) {
      if (error.message.includes('row-level security')) {
        throw new Error('Only free courses can be joined right now.');
      }
      throw new Error('Could not enroll in this course.');
    }
    return { enrolled: true, alreadyEnrolled: false };
  });

export const getMemberQuizzes = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireApprovedMember(context);
    const [quizzes, attempts] = await Promise.all([
      context.supabase.from('quizzes').select('id,course_id,title,description,is_active,created_at,updated_at').eq('is_active', true).order('created_at', { ascending: false }),
      context.supabase.from('quiz_attempts').select('id,quiz_id,score,total,submitted_at').eq('user_id', context.userId).order('submitted_at', { ascending: false }),
    ]);
    if (quizzes.error || attempts.error) throw new Error('Could not load quizzes.');
    const courseIds = [...new Set(quizzes.data.map(quiz => quiz.course_id))];
    const { data: courses, error: courseError } = courseIds.length
      ? await context.supabase.from('courses').select('id,title').in('id', courseIds)
      : { data: [], error: null };
    if (courseError) throw new Error('Could not load quiz courses.');
    const titles = new Map((courses ?? []).map(course => [course.id, course.title]));
    return {
      quizzes: quizzes.data.map(quiz => ({ ...quiz, course_title: titles.get(quiz.course_id) ?? 'Course' })),
      attempts: attempts.data,
    };
  });

export const getMemberQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ quiz_id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireApprovedMember(context);
    const { data: quiz, error } = await context.supabase.rpc('member_quiz_questions', { p_quiz_id: data.quiz_id });
    if (error) throw new Error('This quiz is unavailable. Join its free course first.');
    return quiz;
  });

export const submitMemberQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({
    quiz_id: z.string().uuid(),
    answers: z.record(z.string().uuid(), z.number().int().min(0).max(7)),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await requireApprovedMember(context);
    const { data: result, error } = await context.supabase.rpc('submit_member_quiz', {
      p_quiz_id: data.quiz_id,
      p_answers: data.answers,
    });
    if (error || !result?.[0]) throw new Error('Could not submit quiz answers.');
    return result[0];
  });

export const getMemberSupportTickets = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireApprovedMember(context);
    const { data: tickets, error } = await context.supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', context.userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error('Could not load support tickets.');
    const ids = tickets.map(ticket => ticket.id);
    const { data: messages, error: messageError } = ids.length
      ? await context.supabase.from('support_messages').select('*').in('ticket_id', ids).order('created_at')
      : { data: [], error: null };
    if (messageError) throw new Error('Could not load support replies.');
    const grouped = new Map<string, SupportMessage[]>();
    for (const message of messages ?? []) grouped.set(message.ticket_id, [...(grouped.get(message.ticket_id) ?? []), message]);
    return (tickets as SupportTicket[]).map(ticket => ({ ...ticket, messages: grouped.get(ticket.id) ?? [] }));
  });


export const createMemberSupportTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => supportTicketSchema.parse(input))
  .handler(async ({ data, context }) => {
    const profile = await requireApprovedMember(context);
    const { data: ticketId, error } = await context.supabase.rpc('create_member_support_ticket', {
      p_subject: data.subject,
      p_message: data.message,
    });
    if (error || !ticketId) throw new Error('Could not create support ticket.');
    const { data: ticket, error: ticketLookupError } = await context.supabase
      .from('support_tickets')
      .select('ticket_number,subject')
      .eq('id', ticketId)
      .single();
    if (ticketLookupError || !ticket) throw new Error('Your request was created, but its reference could not be loaded. Please check your support dashboard.');
    const ticketReference = `#${String(ticket.ticket_number).padStart(6, '0')}`;
    const [memberEmail, supportEmail] = await Promise.all([
      sendPlatformEmail(context.supabase, {
        to: profile.email,
        subject: `Support request received · ${ticketReference}`,
        message: `Hello ${profile.first_name},\n\nWe have received your support request and created ticket ${ticketReference}.\n\nSubject: ${ticket.subject}\n\nOur team will review it and reply in your NGABO member dashboard. We will email you when there is an update.`,
      }),
      sendSupportTeamEmail(context.supabase, {
        `New support request · ${ticketReference}`,
        `A member has created a support request.\n\nTicket: ${ticketReference}\nMember: ${profile.first_name} ${profile.last_name} (${profile.email})\nSubject: ${ticket.subject}\n\nMessage: ${data.message}\n\nPlease sign in to the NGABO admin dashboard to respond.`,
      ),
    ]);
    return { ticket_id: ticketId, email: memberEmail, support_email: supportEmail };
  });

export const replyToMemberSupportTicket = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({
    ticket_id: z.string().uuid(),
    message: z.string().trim().min(1).max(5000),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const profile = await requireApprovedMember(context);
    const { error } = await context.supabase.rpc('reply_to_member_support_ticket', {
      p_ticket_id: data.ticket_id,
      p_message: data.message,
    });
    if (error) throw new Error('Could not send your reply.');
    const { data: ticket, error: ticketError } = await context.supabase
      .from('support_tickets')
      .select('ticket_number,subject')
      .eq('id', data.ticket_id)
      .eq('user_id', context.userId)
      .single();
    if (ticketError || !ticket) {
      return { sent: true, email: { sent: false as const, reason: 'recipient_not_found' as const } };
    }
    const ticketReference = `#${String(ticket.ticket_number).padStart(6, '0')}`;
    const [memberEmail, supportEmail] = await Promise.all([
      sendPlatformEmail(context.supabase, {
        to: profile.email,
        subject: `We received your update · ${ticketReference}`,
        message: `Hello ${profile.first_name},\n\nYour update on support ticket ${ticketReference} has been added to the conversation. The ticket is now back with our support team.\n\nSubject: ${ticket.subject}\n\nWe will email you when the team responds.`,
      }),
      sendSupportTeamEmail(context.supabase, {
        `Member replied · ${ticketReference}`,
        `A member has replied to a support ticket.\n\nTicket: ${ticketReference}\nMember: ${profile.first_name} ${profile.last_name} (${profile.email})\nSubject: ${ticket.subject}\n\nReply: ${data.message}\n\nPlease sign in to the NGABO admin dashboard to continue the conversation.`,
      ),
    ]);
    return { sent: true, email: memberEmail, support_email: supportEmail };
  });

export const getAdminPlatformData = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [profileResult, approvalResult, courseResult, quizResult, ticketResult, enrollmentResult] = await Promise.all([
      context.supabase.from('member_profiles').select('*').order('created_at', { ascending: false }),
      context.supabase.from('member_approvals').select('*').order('created_at', { ascending: false }),
      context.supabase.from('courses').select('*').order('created_at', { ascending: false }),
      context.supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
      context.supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }),
      context.supabase.from('course_enrollments').select('id'),
    ]);
    if (
      profileResult.error || !profileResult.data
      || approvalResult.error || !approvalResult.data
      || courseResult.error || !courseResult.data
      || quizResult.error || !quizResult.data
      || ticketResult.error || !ticketResult.data
      || enrollmentResult.error || !enrollmentResult.data
    ) {
      throw new Error('Could not load administration data.');
    }
    const approvalByUser = new Map(approvalResult.data.map(approval => [approval.user_id, approval]));
    const tickets = ticketResult.data as SupportTicket[];
    const ticketIds = tickets.map(ticket => ticket.id);
    const { data: messages, error: messagesError } = ticketIds.length
      ? await context.supabase.from('support_messages').select('*').in('ticket_id', ticketIds).order('created_at')
      : { data: [], error: null };
    if (messagesError) throw new Error('Could not load support conversations.');
    const grouped = new Map<string, SupportMessage[]>();
    for (const message of messages ?? []) grouped.set(message.ticket_id, [...(grouped.get(message.ticket_id) ?? []), message]);
    const profileByUser = new Map(profileResult.data.map(profile => [profile.user_id, profile]));
    return {
      profiles: profileResult.data,
      approvals: profileResult.data.map(profile => ({
        ...profile,
        approval: approvalByUser.get(profile.user_id) ?? null,
      })),
      courses: courseResult.data as Course[],
      quizzes: quizResult.data,
      enrollments: enrollmentResult.data.length,
      tickets: tickets.map(ticket => ({
        ...ticket,
        member: profileByUser.get(ticket.user_id) ?? null,
        messages: grouped.get(ticket.id) ?? [],
      })),
      counts: {
        pendingApprovals: profileResult.data.filter(profile => profile.approval_status === 'pending').length,
        openTickets: tickets.filter(ticket => ticket.status === 'open').length,
        activeCourses: courseResult.data.filter(course => course.is_active).length,
        activeQuizzes: quizResult.data.filter(quiz => quiz.is_active).length,
        members: profileResult.data.length,
      },
    };
  });

export const reviewMemberApproval = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({
    user_id: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
  }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: approval, error } = await context.supabase
      .from('member_approvals')
      .update({ status: data.status, reviewed_by: context.userId })
      .eq('user_id', data.user_id)
      .select('user_id,status')
      .single();
    if (error) {
      if (error.message.includes('verified')) throw new Error('Verify this member’s email before approving the account.');
      throw new Error('Could not update member approval.');
    }
    const emailAddress = await getDeliveryAddress(context.supabase, data.user_id);
    let email: EmailDelivery = { sent: false, reason: 'missing_configuration' };
    if (emailAddress) {
      email = await sendPlatformEmail(context.supabase, {
        to: emailAddress,
        subject: data.status === 'approved' ? 'Your NGABO account is approved' : 'Your NGABO account update',
        message: data.status === 'approved'
          ? 'Your email is verified and your member account has been approved. Sign in to access your dashboard, courses, quizzes, and support.'
          : 'Your member account request was not approved. Please contact NGABO support if you need help.',
      });
    }
    return { ...approval, email };
  });

export const saveAdminCourse = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => courseSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { id, ...values } = data;
    const result = id
      ? await context.supabase.from('courses').update(values).eq('id', id).select('*').single()
      : await context.supabase.from('courses').insert({ ...values, created_by: context.userId }).select('*').single();
    if (result.error) throw new Error('Could not save course.');
    return result.data;
  });

export const archiveAdminCourse = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from('courses').update({ is_active: false }).eq('id', data.id);
    if (error) throw new Error('Could not archive course.');
    return { archived: true };
  });

export const saveAdminQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => quizSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: quizId, error } = await context.supabase.rpc('admin_save_quiz', {
      p_id: data.id ?? null,
      p_course_id: data.course_id,
      p_title: data.title,
      p_description: data.description,
      p_is_active: data.is_active,
      p_questions: data.questions,
    });
    if (error) throw new Error('Could not save quiz.');
    return { id: quizId };
  });

export const archiveAdminQuiz = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from('quizzes').update({ is_active: false }).eq('id', data.id);
    if (error) throw new Error('Could not archive quiz.');
    return { archived: true };
  });


export const replyToSupportTicketAsAdmin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => supportReplySchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: messageId, error } = await context.supabase.rpc('admin_reply_to_support_ticket', {
      p_ticket_id: data.ticket_id,
      p_message: data.message,
      p_resolve: data.resolve ?? false,
    });
    if (error) throw new Error('Could not send support reply.');

    const { data: ticket, error: ticketError } = await context.supabase
      .from('support_tickets')
      .select('user_id,subject,ticket_number,status')
      .eq('id', data.ticket_id)
      .single();
    if (ticketError || !ticket) {
      return { id: messageId, email: { sent: false as const, reason: 'recipient_not_found' as const } };
    }
    const profile = await loadProfile(context.supabase, ticket.user_id);
    if (!profile?.email) {
      return { id: messageId, email: { sent: false as const, reason: 'recipient_not_found' as const } };
    }
    const ticketReference = `#${String(ticket.ticket_number).padStart(6, '0')}`;
    const resolved = data.resolve ?? false;
    const email = await sendPlatformEmail(context.supabase, {
      to: profile.email,
      subject: resolved
        ? `Support ticket resolved · ${ticketReference}`
        : `New support reply · ${ticketReference}`,
      message: resolved
        ? `Hello ${profile.first_name},\n\nOur support team has marked ticket ${ticketReference} as resolved.\n\nSubject: ${ticket.subject}\n\nTeam response: ${data.message}\n\nIf you still need help, reply from your NGABO member dashboard or open a new support request.`
        : `Hello ${profile.first_name},\n\nOur support team has replied to ticket ${ticketReference}.\n\nSubject: ${ticket.subject}\n\nTeam response: ${data.message}\n\nSign in to your NGABO member dashboard to continue the conversation.`,
    });
    return { id: messageId, email };
  });
