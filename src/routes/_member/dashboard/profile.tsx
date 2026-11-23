import { createFileRoute } from '@tanstack/react-router';
import { MemberProfile } from '@/components/member-platform';

export const Route = createFileRoute('/_member/dashboard/profile')({
  component: MemberProfile,
});
