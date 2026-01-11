'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function useAuth() {
  const { isAuthenticated } = useAuthStore();
  const [isRestoring, setIsRestoring] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Determine if we are effectively authenticated (token exists)
    // This simple check handles the Hydration delay
    setIsRestoring(false);
  }, []);

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
