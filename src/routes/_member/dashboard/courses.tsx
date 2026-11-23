import { createFileRoute } from '@tanstack/react-router';
import { MemberCourses } from '@/components/member-platform';

export const Route = createFileRoute('/_member/dashboard/courses')({
  component: MemberCourses,
});
