'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, 
  Globe, 
  Palette, 
  PiggyBank, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const profileSchema = z.object({
  display_name: z.string().min(2),
  currency: z.string().length(3),
  timezone: z.string(),
});

const balanceSchema = z.object({
  opening_balance: z.coerce.number().min(0),
});

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [isSaved, setIsSaved] = React.useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: user?.profile?.display_name || '',
      currency: user?.profile?.currency || 'USD',
      timezone: user?.profile?.timezone || 'UTC',
    }
  });

  const balanceForm = useForm({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      opening_balance: 0,
    }
  });

  const onProfileSubmit = async (data: any) => {
    // In a real app, send to API
    console.log('Profile update', data);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const onBalanceSubmit = async (data: any) => {
    // Current week ISO start
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff)).toISOString().split('T')[0];

    await db.weeks.put({
      id: uuidv4(),
      week_start_date: monday,
      opening_balance: data.opening_balance,
      updated_at: new Date().toISOString(),
      is_synced: 0,
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuración</h2>
        <p className="text-muted-foreground text-sm">Gestiona tu perfil, preferencias y configuración de cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <User size={20} className="text-emerald-500" />
            Información de Perfil
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Personaliza tu experiencia e identidad pública.</p>
        </div>
        <div className="md:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre a Mostrar</label>
                <input 
                  {...profileForm.register('display_name')}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Moneda Preferida</label>
                <select 
                  {...profileForm.register('currency')}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="USD">USD - Dólar Estadounidense</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - Libra Esterlina</option>
                  <option value="COP">COP - Peso Colombiano</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-emerald-600 transition-all shadow-md">
                <Save size={18} /> Guardar Perfil
              </button>
            </div>
          </form>
        </div>

        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <PiggyBank size={20} className="text-teal-500" />
            Saldo Semanal
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Define con cuánto estás iniciando esta semana.</p>
        </div>
        <div className="md:col-span-2 bg-card rounded-2xl border border-border p-6 shadow-sm">
          <form onSubmit={balanceForm.handleSubmit(onBalanceSubmit)} className="space-y-4">
            {new Date().getDay() !== 1 && (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm font-medium flex items-center gap-2">
                <span>⚠️ El saldo inicial solo se puede modificar los lunes para mantener la consistencia semanal.</span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Saldo Inicial de la Semana</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input 
                  {...balanceForm.register('opening_balance')}
                  type="number"
                  disabled={new Date().getDay() !== 1}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Este valor se usará como base para calcular tu saldo restante de la semana actual.</p>
            </div>
            <div className="flex justify-end">
              <button 
                disabled={new Date().getDay() !== 1}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} /> Establecer Saldo
              </button>
            </div>
          </form>
        </div>
      </div>

      {isSaved && (
        <div className="fixed bottom-8 right-8 animate-in slide-in-from-right-8 fade-in flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl shadow-2xl">
          <CheckCircle2 size={20} />
          <span className="font-medium">¡Cambios guardados exitosamente!</span>
        </div>
      )}
    </div>
  );
}
