'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  CalendarClock, 
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Pencil,
  X
} from 'lucide-react';
import { useFinanceData } from '@/hooks/use-finance-data';
import { useSync } from '@/hooks/use-sync';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

const paymentSchema = z.object({
  payee: z.string().min(2),
  amount: z.coerce.number().positive(),
  due_date: z.string(),
  notes: z.string().optional(),
  expected_method: z.string().optional(),
});

export default function PaymentsPage() {
  const { payments } = useFinanceData();
  const { sync } = useSync();
  const [showForm, setShowForm] = React.useState(false);
  const [editingPayment, setEditingPayment] = React.useState<any>(null);
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');
  const [dateRange, setDateRange] = React.useState({
    start: '',
    end: ''
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      due_date: new Date().toISOString().split('T')[0],
      expected_method: 'TRANSFER'
    }
  });

  // Populate form when editing
  React.useEffect(() => {
    if (editingPayment) {
      setValue('payee', editingPayment.payee);
      setValue('amount', editingPayment.amount);
      setValue('due_date', editingPayment.due_date);
      setValue('expected_method', editingPayment.expected_method || 'TRANSFER');
      setValue('notes', editingPayment.notes || '');
      setShowForm(true);
    }
  }, [editingPayment, setValue]);

  // Handle outside click for menus
  React.useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const onNewRegistration = () => {
    setEditingPayment(null);
    reset({
      payee: '',
      amount: undefined as any,
      due_date: new Date().toISOString().split('T')[0],
      expected_method: 'TRANSFER',
      notes: ''
    });
    setShowForm(true);
  };

  const onSubmit = async (data: any) => {
    setShowForm(false);
    
    const paymentId = editingPayment ? editingPayment.id : uuidv4();
    const status = editingPayment ? editingPayment.status : 'PENDING';
    
    await db.payments.put({
      id: paymentId,
      ...data,
      status: status,
      updated_at: new Date().toISOString(),
      is_synced: 0,
    });
    
    setEditingPayment(null);
    reset();

    if (navigator.onLine) {
      sync();
    }
  };

  const markAsPaid = async (payment: any) => {
    const now = new Date().toISOString();
    
    // 1. Create linked transaction
    await db.transactions.add({
      id: uuidv4(),
      type: 'EXPENSE',
      amount: payment.amount,
      date: now.split('T')[0],
      counterparty: payment.payee,
      description: `Payment for ${payment.payee}. ${payment.notes || ''}`,
      method: payment.expected_method || 'OTHER',
      linked_payment_id: payment.id,
      updated_at: now,
      is_synced: 0,
    });

    // 2. Update payment status
    await db.payments.update(payment.id, {
      status: 'PAID',
      updated_at: now,
      is_synced: 0,
    });

    if (navigator.onLine) {
      sync();
    }
  };

  const filteredPayments = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return payments.filter(p => {
      // 1. Search Logic
      const matchesSearch = p.payee.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Status Logic
      let matchesStatus = true;
      if (statusFilter === 'PAID') matchesStatus = p.status === 'PAID';
      else if (statusFilter === 'PENDING') matchesStatus = p.status === 'PENDING' && p.due_date >= today;
      else if (statusFilter === 'OVERDUE') matchesStatus = p.status === 'PENDING' && p.due_date < today;
      // 'ALL' matches everything
      
      // 3. Date Logic
      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        matchesDate = p.due_date >= dateRange.start && p.due_date <= dateRange.end;
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [payments, searchTerm, statusFilter, dateRange]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pagos Programados</h2>
          <p className="text-muted-foreground text-sm">Nunca olvides una cuenta. Organiza tus compromisos pendientes.</p>
        </div>
        <button 
          onClick={onNewRegistration}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground font-medium shadow-lg shadow-emerald-500/20 transition-all shrink-0"
        >
          <Plus size={20} />
          <span>Nueva Programación</span>
        </button>
      </div>

      {/* FILTER BAR 🧠 */}
      <div className="flex flex-col xl:flex-row items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-sm">
        
        {/* Search */}
        <div className="relative flex-1 w-full xl:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-transparent focus:border-primary rounded-xl text-sm outline-none transition-all"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex p-1 bg-muted/50 rounded-xl w-full xl:w-auto overflow-x-auto">
          {(['ALL', 'PENDING', 'OVERDUE', 'PAID'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                statusFilter === status 
                  ? (status === 'OVERDUE' ? "bg-rose-500 text-white shadow-sm" : "bg-card text-foreground shadow-sm")
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {{ ALL: 'Todos', PENDING: 'Próximos', OVERDUE: 'Vencidos', PAID: 'Pagados' }[status]}
            </button>
          ))}
        </div>

        {/* Date Range */}
        <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl w-full xl:w-auto">
          <div className="flex items-center px-3 py-1 gap-2 border-r border-border/50">
            <span className="text-xs font-bold text-muted-foreground">DESDE</span>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent border-none text-sm text-foreground focus:ring-0 p-0 w-[110px]"
            />
          </div>
          <div className="flex items-center px-3 py-1 gap-2">
            <span className="text-xs font-bold text-muted-foreground">HASTA</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent border-none text-sm text-foreground focus:ring-0 p-0 w-[110px]"
            />
          </div>
        </div>

      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xl animate-in zoom-in-95">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">
              {editingPayment ? 'Editar Programación' : 'Nueva Programación'}
            </h3>
            <button 
              onClick={() => {
                setShowForm(false);
                setEditingPayment(null);
              }}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Beneficiario (A quién pagar)</label>
                <input 
                  {...register('payee')}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="ej. Arrendador, Empresa Eléctrica"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Monto</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('amount')}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Fecha de Vencimiento</label>
                <input 
                  type="date"
                  {...register('due_date')}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Método Esperado</label>
                <select 
                  {...register('expected_method')}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground appearance-none cursor-pointer"
                >
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="CASH">Efectivo</option>
                  <option value="OTHER">Otro</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Notas (Opcional)</label>
                <input 
                  {...register('notes')}
                  className="mt-1 w-full px-4 py-2 rounded-xl border border-input bg-muted outline-none focus:ring-2 focus:ring-primary text-foreground"
                  placeholder="Añade una nota..."
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <button type="button" onClick={() => { setShowForm(false); setEditingPayment(null); }} className="px-4 py-2 rounded-xl border border-border font-medium text-sm text-foreground hover:bg-muted transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-emerald-600 text-sm shadow-md transition-all">
                  {editingPayment ? 'Actualizar' : 'Programar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayments.map((payment) => {
          const isOverdue = new Date(payment.due_date) < new Date() && payment.status === 'PENDING';
          return (
            <div key={payment.id} className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CalendarClock size={24} />
                </div>
                <div className="flex items-center gap-2 relative">
                  <StatusBadge status={payment.status === 'PAID' ? 'PAID' : (isOverdue ? 'OVERDUE' : 'PENDING')} />
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === payment.id ? null : payment.id);
                    }}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {activeMenuId === payment.id && (
                    <div className="absolute right-0 top-8 w-32 bg-card border border-border rounded-xl shadow-xl z-20 py-1 animate-in fade-in zoom-in-95">
                      <button 
                        onClick={() => setEditingPayment(payment)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 text-foreground font-medium"
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground uppercase tracking-tight">{payment.payee}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Clock size={14} /> Vence el {payment.due_date}
                </p>
                {payment.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{payment.notes}</p>}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1">Monto</p>
                  <p className="text-3xl font-black text-foreground">${Number(payment.amount).toLocaleString()}</p>
                </div>
                {payment.status === 'PENDING' && (
                  <button 
                    onClick={() => markAsPaid(payment)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-primary-foreground text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    Marcar Pagado
                  </button>
                )}
                {payment.status === 'PAID' && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-sm font-bold">
                    <CheckCircle2 size={18} /> Confirmado
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredPayments.length === 0 && (
          <div className="col-span-full p-20 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-border">
            <Search size={48} className="mx-auto text-muted mb-4" />
            <p className="text-muted-foreground font-medium">No se encontraron pagos con estos filtros.</p>
            <button onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setDateRange({start: '', end: ''}); }} className="mt-2 text-primary hover:underline font-bold text-sm">Limpiar filtros</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'PAID' | 'OVERDUE' }) {
  const styles = {
    PENDING: "bg-amber-500/10 text-amber-600",
    PAID: "bg-emerald-500/10 text-emerald-600",
    OVERDUE: "bg-rose-500/10 text-rose-600",
  };
  const labels = {
    PENDING: "PENDIENTE",
    PAID: "PAGADO",
    OVERDUE: "VENCIDO",
  };
  const icons = {
    PENDING: Clock,
    PAID: CheckCircle2,
    OVERDUE: AlertCircle,
  };
  const Icon = icons[status];

  return (
    <span className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      styles[status]
    )}>
      <Icon size={12} /> {labels[status]}
    </span>
  );
}
