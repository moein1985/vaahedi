import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/ai-advisor/')({
  component: AiAdvisorAliasPage,
});

function AiAdvisorAliasPage() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('chat-mode', 'advisor');
  }
  return <Navigate to="/chat" replace />;
}
