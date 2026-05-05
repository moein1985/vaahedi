import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/documents/')({
  component: DocumentsAliasPage,
});

function DocumentsAliasPage() {
  return <Navigate to="/downloads" />;
}
