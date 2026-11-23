import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_member/dashboard')({
  component: Outlet,
});
