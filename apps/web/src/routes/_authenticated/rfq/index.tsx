import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/rfq/')({
  component: RfqAliasPage,
});

function RfqAliasPage() {
  return <Navigate to="/trade" />;
}
