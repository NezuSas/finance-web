'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function useAuth() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
      router.push('/login');
    }
    if (isAuthenticated && PUBLIC_ROUTES.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, pathname, router]);

  return { isAuthenticated };
}
