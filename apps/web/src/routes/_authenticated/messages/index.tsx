import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/messages/')({
  component: MessagesAliasPage,
});

function MessagesAliasPage() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('chat-mode', 'messages');
  }
  return <Navigate to="/chat" replace />;
}
