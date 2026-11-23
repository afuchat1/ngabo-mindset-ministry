import { createFileRoute } from '@tanstack/react-router';
import { AdminLearning } from '@/components/member-platform/admin-learning';

export const Route = createFileRoute('/_authenticated/admin-learning')({
  head: () => ({
    meta: [
      { title: 'Member administration | NGABO (MMA)' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: AdminLearning,
});
