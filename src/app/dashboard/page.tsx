'use client';

import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Calendar,
  Search,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { useFinanceData } from '@/hooks/use-finance-data';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { summary, transactions, payments } = useFinanceData();

  const nextPayments = payments
    .filter(p => p.status === 'PENDING')
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Resumen Financiero</h2>
          <p className="text-muted-foreground text-sm">Sigue tu desempeño semanal y tus compromisos pendientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transactions?add=true" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-medium shadow-lg shadow-emerald-500/20 transition-all">
            <Plus size={20} />
            <span>Nuevo Registro</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Saldo Actual" 
          amount={summary.currentBalance} 
          icon={Wallet} 
          color="emerald"
        />
        <SummaryCard 
          title="Ingresos Totales" 
          amount={summary.totalIncome} 
          icon={ArrowUpRight} 
          color="teal"
        />
        <SummaryCard 
          title="Gastos Totales" 
          amount={summary.totalExpense} 
          icon={ArrowDownRight} 
          color="rose"
        />
        <SummaryCard 
          title="Saldo Inicial" 
          amount={summary.openingBalance} 
          icon={Calendar} 
          color="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Transacciones Recientes</h3>
            <Link href="/transactions" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              Ver Todo <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        tx.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {tx.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.counterparty}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {tx.date}
                          {tx.description && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <span className="line-clamp-1">{tx.description}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "font-semibold",
                      tx.type === 'INCOME' ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <div className="p-4 rounded-full bg-muted mb-4 text-emerald-500">
                  <ArrowLeftRight size={32} />
                </div>
                <p>No hay transacciones</p>
                <p className="text-xs">Comienza agregando tu primer movimiento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Next Payments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Próximos Pagos</h3>
            <Link href="/payments" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
              Gestionar <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {nextPayments.length > 0 ? (
              nextPayments.map((payment) => (
                <div key={payment.id} className="p-4 bg-card rounded-2xl border border-border space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground">{payment.payee}</p>
                      <p className="text-xs text-muted-foreground">Vence el {payment.due_date}</p>
                    </div>
                    {new Date(payment.due_date) < new Date(new Date().setHours(0,0,0,0)) ? (
                      <span className="px-2 py-1 rounded-md bg-rose-500/10 text-rose-600 text-[10px] font-bold uppercase tracking-wider">
                        Vencido
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-lg font-bold text-foreground">${Number(payment.amount).toLocaleString()}</p>
                    <Link href={`/payments?pay=${payment.id}`} className="px-3 py-1.5 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
                      Pagar ahora
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 bg-muted/50 rounded-2xl border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">No hay pagos pendientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color, trend }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    teal: "bg-teal-500/10 text-teal-500",
    rose: "bg-rose-500/10 text-rose-500",
    slate: "bg-slate-500/10 text-slate-500"
  };

  return (
    <div className="p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-xl", colorMap[color])}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend.startsWith('+') ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1 text-foreground">${Number(amount).toLocaleString()}</p>
      </div>
    </div>
  );
}
