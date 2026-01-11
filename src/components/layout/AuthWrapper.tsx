'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";

const AUTH_ROUTES = ['/loginsearch_', '/login', '/register', '/forgot-password'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isRestoring } = useAuth();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

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
      <div className="flex-1 flex flex-col lg:pl-64 transition-[padding,margin] duration-300 ease-in-out pb-20 md:pb-0">
        <Header />
        <main className="flex-1 p-6 lg:p-10 bg-background min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileBottomBar />
    </div>
  );
}
