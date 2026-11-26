import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveAdminCourse,
  archiveAdminQuiz,
  createMemberSupportTicket,
  enrollInFreeCourse,
  getAdminPlatformData,
  getSupportTeamDashboard,
  replyToSupportTeamTicket,
  getMemberCourses,
  getMemberDashboard,
  getMemberQuiz,
  getMemberQuizzes,
  getMemberSupportTickets,
  replyToMemberSupportTicket,
  replyToSupportTicketAsAdmin,
  reviewMemberApproval,
  saveAdminCourse,
  saveAdminQuiz,
  submitMemberQuiz,
  updateMemberProfile,
} from "@/lib/member-platform.functions";
import type { CourseInput, MemberProfileInput, QuizInput } from "@/lib/member-platform";

export const platformKeys = {
  dashboard: ["member-platform", "dashboard"] as const,
  courses: ["member-platform", "courses"] as const,
  quizzes: ["member-platform", "quizzes"] as const,
  quiz: (id: string) => ["member-platform", "quiz", id] as const,
  support: ["member-platform", "support"] as const,
  admin: ["member-platform", "admin"] as const,
};

export function useMemberDashboard() {
  return useQuery({ queryKey: platformKeys.dashboard, queryFn: () => getMemberDashboard() });
}

export function useMemberCourses() {
  return useQuery({ queryKey: platformKeys.courses, queryFn: () => getMemberCourses() });
}

export function useMemberQuizzes() {
  return useQuery({ queryKey: platformKeys.quizzes, queryFn: () => getMemberQuizzes() });
}

export function useMemberQuiz(id: string, enabled = true) {
  return useQuery({
    queryKey: platformKeys.quiz(id),
    queryFn: () => getMemberQuiz({ data: { quiz_id: id } }),
    enabled: Boolean(id) && enabled,
  });
}

export function useMemberSupportTickets() {
  return useQuery({ queryKey: platformKeys.support, queryFn: () => getMemberSupportTickets(), refetchInterval: 15000 });
}

export function useAdminPlatformData() {
  return useQuery({ queryKey: platformKeys.admin, queryFn: () => getAdminPlatformData(), refetchInterval: 15000 });
}

export function useUpdateMemberProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: MemberProfileInput) =>
      updateMemberProfile({ data }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: platformKeys.dashboard });
    },
  });
}

export function useEnrollInFreeCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (course_id: string) => enrollInFreeCourse({ data: { course_id } }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.courses }),
        client.invalidateQueries({ queryKey: platformKeys.dashboard }),
      ]);
    },
  });
}

export function useSubmitMemberQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { quiz_id: string; answers: Record<string, number> }) =>
      submitMemberQuiz({ data: input }),
    onSuccess: async (_result, input) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.quizzes }),
        client.invalidateQueries({ queryKey: platformKeys.quiz(input.quiz_id) }),
      ]);
    },
  });
}

export function useCreateMemberSupportTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { subject: string; message: string }) =>
      createMemberSupportTicket({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.support }),
        client.invalidateQueries({ queryKey: platformKeys.dashboard }),
      ]);
    },
  });
}

export function useReplyToMemberSupportTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { ticket_id: string; message: string }) =>
      replyToMemberSupportTicket({ data: input }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: platformKeys.support });
    },
  });
}

export function useReviewMemberApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { user_id: string; status: "approved" | "rejected" }) =>
      reviewMemberApproval({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.dashboard }),
      ]);
    },
  });
}

export function useSaveAdminCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CourseInput) =>
      saveAdminCourse({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.courses }),
      ]);
    },
  });
}

export function useArchiveAdminCourse() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAdminCourse({ data: { id } }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.courses }),
      ]);
    },
  });
}

export function useSaveAdminQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: QuizInput) =>
      saveAdminQuiz({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.quizzes }),
      ]);
    },
  });
}

export function useArchiveAdminQuiz() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveAdminQuiz({ data: { id } }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.quizzes }),
      ]);
    },
  });
}

export function useReplyToSupportTicketAsAdmin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { ticket_id: string; message: string; resolve?: boolean }) =>
      replyToSupportTicketAsAdmin({ data: input }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: platformKeys.admin }),
        client.invalidateQueries({ queryKey: platformKeys.support }),
      ]);
    },
  });
}
