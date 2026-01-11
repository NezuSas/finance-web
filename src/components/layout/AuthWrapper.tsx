'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";

import { APP_VERSION } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import { useSync } from '@/hooks/use-sync';

const AUTH_ROUTES = ['/loginsearch_', '/login', '/register', '/forgot-password'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  const { sync } = useSync();

  // Version Check & Initial Sync Effect
  React.useEffect(() => {
    const init = async () => {
      // 1. Version Check
      const storedVersion = localStorage.getItem('app_version');
      if (storedVersion !== APP_VERSION) {
        console.log(`Version mismatch: ${storedVersion} vs ${APP_VERSION}. Forcing logout/cleanup.`);
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('last_sync_at');
        localStorage.setItem('app_version', APP_VERSION);
        
        useAuthStore.getState().logout();
        window.location.reload();
        return;
      }

      // 2. Auto-Sync on Fresh Login
      // If we are authenticated but have never synced on this device (post-cleanup or fresh login)
      if (isAuthenticated && !localStorage.getItem('last_sync_at')) {
        console.log("Fresh login detected. Triggering initial background sync.");
        sync();
      }
    };
    init();
  }, [isAuthenticated, sync]);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If not authenticated and not on auth route, useAuth will redirect
  if (!isAuthenticated) {
    return null; // Don't render "Redirecting..." text, just wait for router.push
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pl-64 transition-[padding,margin] duration-300 ease-in-out pb-20 md:pb-0">
        <Header />
        <main className="flex-1 p-6 lg:p-10 bg-background min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomBar />
    </div>
  );
}
