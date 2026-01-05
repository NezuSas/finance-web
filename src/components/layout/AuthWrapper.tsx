'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const AUTH_ROUTES = ['/loginsearch_', '/login', '/register', '/forgot-password'];

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If not authenticated and not on auth route, useAuth will redirect
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-emerald-500 font-semibold">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 ease-in-out">
        <Header />
        <main className="flex-1 p-6 lg:p-10 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
