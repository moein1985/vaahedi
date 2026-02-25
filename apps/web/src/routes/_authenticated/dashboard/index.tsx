import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: lazyRouteComponent(() => import('./-DashboardPage'), 'DashboardPage'),
});
