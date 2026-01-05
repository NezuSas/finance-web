'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { useSync } from '@/hooks/use-sync';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { syncAsync } = useSync();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/auth/token/', data);
      const { access, refresh } = response.data;
      
      // Get user profile
      const userResponse = await apiClient.get('/auth/profile/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      
      // Update Local State
      setAuth(userResponse.data, access, refresh);
      
      // Initial Sync (Pull data)
      try {
        await syncAsync();
      } catch (syncError) {
        console.error('Initial sync failed:', syncError);
        // Continue anyway, dashboard will load from empty local or cache
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Bienvenido de nuevo</h2>
          <p className="mt-2 text-muted-foreground">Inicia sesión para gestionar tus finanzas</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error && (
            <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Correo Electrónico</label>
              <input
                {...register('email')}
                className={cn(
                  "mt-1 block w-full px-4 py-3 rounded-xl border bg-muted focus:ring-2 focus:ring-primary transition-all outline-none text-foreground",
                  errors.email ? "border-rose-500" : "border-input"
                )}
                placeholder="tu@ejemplo.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">Contraseña</label>
              <input
                {...register('password')}
                type="password"
                className={cn(
                  "mt-1 block w-full px-4 py-3 rounded-xl border bg-muted focus:ring-2 focus:ring-primary transition-all outline-none text-foreground",
                  errors.password ? "border-rose-500" : "border-input"
                )}
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-semibold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Crea una
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
