'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinanceData } from '@/hooks/use-finance-data';
import { useSync } from '@/hooks/use-sync';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Filter,
  Trash2,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const txSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.coerce.number().positive(),
  date: z.string(),
  counterparty: z.string().min(2),
  description: z.string().optional(),
  method: z.enum(['TRANSFER', 'CASH', 'CARD', 'OTHER']),
});

export default function TransactionsPage() {
  const { transactions } = useFinanceData();
  const { sync } = useSync();
  // State
  const [showForm, setShowForm] = React.useState(false);
  const [editingTx, setEditingTx] = React.useState<any>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Filters
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      method: 'CASH'
    }
  });

  // Populate form when editing
  React.useEffect(() => {
    if (editingTx) {
      setValue('type', editingTx.type);
      setValue('amount', editingTx.amount);
      setValue('date', editingTx.date);
      setValue('counterparty', editingTx.counterparty);
      setValue('description', editingTx.description || '');
      setValue('method', editingTx.method);
      setShowForm(true);
    }
  }, [editingTx, setValue]);

  // Reset pagination when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate, methodFilter]);

  // Handle outside click for menus
  React.useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const onNewRegistration = () => {
    setEditingTx(null);
    reset({
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      method: 'CASH',
      amount: undefined as any,
      counterparty: '',
      description: ''
    });
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    // Optimistic UI updates
    setShowForm(false);
    
    const txId = editingTx ? editingTx.id : uuidv4();
    
    await db.transactions.put({
      id: txId,
      ...data,
      description: data.description || '',
      updated_at: new Date().toISOString(),
      is_synced: 0,
    });

    setEditingTx(null);
    reset();

    // Trigger background sync
    if (navigator.onLine) {
       sync();
    }
  };

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter(tx => {
      // Text Search
      const matchesSearch = 
        tx.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()));

      // Date Range
      const matchesDate = 
        (!startDate || tx.date >= startDate) && 
        (!endDate || tx.date <= endDate);

      // Method Filter
      const matchesMethod = 
        methodFilter === 'ALL' || tx.method === methodFilter;

      return matchesSearch && matchesDate && matchesMethod;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, startDate, endDate, methodFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Movimientos</h2>
          <p className="text-muted-foreground text-sm">Monitorea todos tus movimientos financieros en un solo lugar.</p>
        </div>
        <button 
          onClick={onNewRegistration}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-medium shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={20} />
          <span>Nuevo Registro</span>
        </button>
      </div>

      {/* Form Overlay/Section */}
      {showForm && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xl animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">
              {editingTx ? 'Editar Movimiento' : 'Nuevo Registro'}
            </h3>
            <button 
              onClick={() => {
                setShowForm(false);
                setEditingTx(null);
              }}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Top: Type Selector */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Movimiento</label>
              <div className="flex gap-4 p-1 bg-muted rounded-xl">
                {[
                  { val: 'INCOME', label: 'INGRESO', icon: ArrowUpRight },
                  { val: 'EXPENSE', label: 'GASTO', icon: ArrowDownRight }
                ].map((t) => (
                  <label key={t.val} className="flex-1 relative cursor-pointer group">
                    <input 
                      type="radio" 
                      value={t.val} 
                      {...register('type')} 
                      className="sr-only peer"
                    />
                    <div className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-semibold text-sm",
                      "peer-checked:bg-card peer-checked:shadow-sm peer-checked:text-foreground",
                      "text-muted-foreground hover:text-foreground"
                    )}>
                      <t.icon size={18} className={t.val === 'INCOME' ? "peer-checked:text-emerald-500" : "peer-checked:text-rose-500"} />
                      {t.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Grid: Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground">Monto</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('amount')}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground font-semibold"
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount.message as string}</p>}
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Fecha</label>
                <input 
                  type="date"
                  {...register('date')}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
                {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date.message as string}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Contraparte</label>
                <input 
                  {...register('counterparty')}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="ej. Starbucks, Salario"
                />
                {errors.counterparty && <p className="mt-1 text-xs text-rose-500">{errors.counterparty.message as string}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Método de Pago</label>
                <select 
                  {...register('method')}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground cursor-pointer"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            {/* Full Width: Description */}
            <div>
               <label className="text-sm font-medium text-foreground">Descripción (Opcional)</label>
               <input 
                 {...register('description')}
                 className="mt-1 w-full px-4 py-2.5 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                 placeholder="ej. Café con amigos - Detalle adicional"
               />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingTx(null);
                }} 
                className="px-6 py-2.5 rounded-xl border border-border font-medium text-sm text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-emerald-600 text-sm shadow-md shadow-emerald-500/20 transition-all"
              >
                {editingTx ? 'Actualizar Movimiento' : 'Guardar Movimiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
              />
            </div>
            <button 
              onClick={() => {
                if (showFilters) {
                  setStartDate('');
                  setEndDate('');
                  setMethodFilter('ALL');
                }
                setShowFilters(!showFilters);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm font-medium border",
                showFilters 
                  ? "bg-primary/10 text-primary border-primary" 
                  : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Filter size={18} /> 
              Filtrar
              {showFilters ? <X size={16} className="ml-1" /> : null}
            </button>
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Desde</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Hasta</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Método</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary text-foreground"
                >
                  <option value="ALL">Todos</option>
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Transacción</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Método</th>
                <th className="px-6 py-4 text-right">Monto</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        tx.type === 'INCOME' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {tx.type === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{tx.counterparty}</p>
                        {tx.description && <p className="text-xs text-muted-foreground">{tx.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{tx.date}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-muted text-foreground text-[10px] font-bold uppercase">
                      {tx.method === 'CASH' ? 'Efectivo' : tx.method === 'TRANSFER' ? 'Transferencia' : tx.method === 'CARD' ? 'Tarjeta' : 'Otro'}
                    </span>
                  </td>
                  <td className={cn(
                    "px-6 py-4 text-right font-bold",
                    tx.type === 'INCOME' ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {tx.type === 'INCOME' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === tx.id ? null : tx.id);
                      }}
                      className="p-1.5 rounded-lg group-hover:bg-muted transition-all"
                    >
                      <MoreVertical size={16} className="text-muted-foreground" />
                    </button>
                    
                    {activeMenuId === tx.id && (
                      <div className="absolute right-6 top-10 w-36 bg-card border border-border rounded-xl shadow-xl z-10 py-1 animate-in fade-in zoom-in-95">
                        <button 
                          onClick={() => setEditingTx(tx)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-foreground"
                        >
                          <Pencil size={14} />
                          <span className="flex-1">Editar</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No se encontraron movimientos.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} de {filteredTransactions.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium px-2">Página {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
