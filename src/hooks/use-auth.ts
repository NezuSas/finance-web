'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function useAuth() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  // If store is not hydrated, we are "restoring"
  const isRestoring = !isHydrated;

  useEffect(() => {
    if (isRestoring) return;

    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    }
    
    if (isAuthenticated && PUBLIC_ROUTES.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router, isRestoring]);

  return { isAuthenticated, isRestoring };
}
