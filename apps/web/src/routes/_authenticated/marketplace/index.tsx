import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/marketplace/')({
  component: MarketplaceAliasPage,
});

function MarketplaceAliasPage() {
  return <Navigate to="/catalog" />;
}
