import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../server/src/interface/trpc/root.router.js';

// ─── tRPC React Client ────────────────────────────────────────────────────────

export const trpc = createTRPCReact<AppRouter>();

// ─── Auth Token Store (در‌حافظه — Access Token) ───────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ─── tRPC Client Factory ──────────────────────────────────────────────────────

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: '/trpc',
        transformer: superjson,
        headers() {
          const headers: Record<string, string> = {};
          if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
          }
          return headers;
        },
      }),
    ],
  });
}
