import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken } from '../trpc.js';

// ─── Auth Store ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  userCode: string;
  role: string;
  status: string;
  mobile: string;
  email: string | null;
  isAdmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser, token: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        setAccessToken(token);
        set({ user, accessToken: token, isAuthenticated: true });
      },

      setToken: (token) => {
        setAccessToken(token);
        set({ accessToken: token });
      },

      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'vaahedi-auth',
      // user و isAuthenticated را ذخیره می‌کنیم؛ accessToken را نه (امنیت)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          console.log('[Auth] Rehydrated user:', state.user.userCode);
          // accessToken در حافظه نیست؛ _authenticated.tsx آن را refresh می‌کند
        }
      },
    },
  ),
);
