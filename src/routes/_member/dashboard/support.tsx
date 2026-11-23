import { createFileRoute } from '@tanstack/react-router';
import { MemberSupport } from '@/components/member-platform';

export const Route = createFileRoute('/_member/dashboard/support')({
  component: MemberSupport,
});
