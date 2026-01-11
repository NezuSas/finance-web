'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CalendarClock, 
  Settings, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

export function MobileBottomBar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: ArrowLeftRight, label: 'Movimientos', href: '/transactions' },
    { icon: CalendarClock, label: 'Pagos', href: '/payments' },
    { icon: BarChart3, label: 'Reportes', href: '/reports' },
    { icon: Settings, label: 'Ajustes', href: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex md:hidden justify-around items-center px-2 py-2 pb-safe-area-inset-bottom">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16",
              isActive 
                ? "text-primary font-bold bg-primary/10" 
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] mt-1 truncate max-w-full">{item.label}</span>
          </Link>
        );
      })}
      
      <button
        onClick={logout}
        className="flex flex-col items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all w-16"
      >
        <LogOut size={20} />
        <span className="text-[10px] mt-1">Salir</span>
      </button>
    </div>
  );
}
