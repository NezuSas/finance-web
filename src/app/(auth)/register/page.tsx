'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/register/', {
        username: data.username,
        email: data.email,
        password: data.password,
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Algo salió mal. Por favor intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-xl border border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Crear Cuenta</h2>
          <p className="mt-2 text-muted-foreground">Únete a FinTrack para empezar a rastrear</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {error && (
            <div className="p-3 text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Nombre de Usuario</label>
              <input
                {...register('username')}
                className={cn(
                  "mt-1 block w-full px-4 py-3 rounded-xl border bg-muted focus:ring-2 focus:ring-primary transition-all outline-none text-foreground",
                  errors.username ? "border-rose-500" : "border-input"
                )}
                placeholder="juanperez"
              />
              {errors.username && <p className="mt-1 text-xs text-rose-500">{errors.username.message}</p>}
            </div>

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

            <div>
              <label className="block text-sm font-medium text-foreground">Confirmar Contraseña</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className={cn(
                  "mt-1 block w-full px-4 py-3 rounded-xl border bg-muted focus:ring-2 focus:ring-primary transition-all outline-none text-foreground",
                  errors.confirmPassword ? "border-rose-500" : "border-input"
                )}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-semibold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50"
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Iniciar Sesión
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
