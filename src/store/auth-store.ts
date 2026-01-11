import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '@/lib/db';
import { APP_VERSION } from '@/lib/constants';

interface User {
  id: string;
  email: string;
  username: string;
  profile: {
    display_name: string;
    currency: string;
    timezone: string;
    theme_preference: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },
      updateUser: (user) => {
        set({ user });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('last_sync_at');
        // Clear IndexedDB tables
        db.transactions.clear();
        db.payments.clear();
        db.weeks.clear();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;

          // Version Enforcement
          const storedVersion = localStorage.getItem('app_version');
          
          if (storedVersion !== APP_VERSION) {
            console.log(`Version mismatch: ${storedVersion} vs ${APP_VERSION}. Clearing cache...`);
            
            // 1. Clear LocalStorage keys managed manually
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('last_sync_at');
            
            // 2. Clear IndexedDB
            db.transactions.clear();
            db.payments.clear();
            db.weeks.clear();

            // 3. Reset State
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;

            // 4. Update Version
            localStorage.setItem('app_version', APP_VERSION);
          }
        }
      },
    }
  )
);
