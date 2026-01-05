'use client';

import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
