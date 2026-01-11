'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, Wifi, WifiOff, RefreshCcw } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useSync } from '@/hooks/use-sync';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(true);
  const user = useAuthStore((state) => state.user);
  const { sync, isSyncing } = useSync();

  React.useEffect(() => {
    setMounted(true);
    
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Initial check
    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-4 pl-0 lg:pl-0 transition-all">
        <h1 className="hidden sm:block text-lg font-semibold text-foreground">
          Bienvenido de nuevo, {user?.profile?.display_name || user?.username || 'Usuario'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Wifi size={14} /> En línea
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
              <WifiOff size={14} /> Sin conexión
            </span>
          )}
        </div>

        {/* Sync Button */}
        <button 
          onClick={() => sync()}
          disabled={!isOnline || isSyncing}
          className={cn(
            "p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50",
            isSyncing && "animate-spin text-emerald-500"
          )}
        >
          <RefreshCcw size={20} />
        </button>

        {/* Theme Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
