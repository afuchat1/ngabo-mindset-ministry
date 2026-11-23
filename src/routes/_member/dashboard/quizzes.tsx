import { createFileRoute } from '@tanstack/react-router';
import { MemberQuizzes } from '@/components/member-platform';

export const Route = createFileRoute('/_member/dashboard/quizzes')({
  component: MemberQuizzes,
});
