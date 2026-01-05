'use client';

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon,
  Download,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useFinanceData } from '@/hooks/use-finance-data';
import { cn } from '@/lib/utils';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportsPage() {
  const { transactions } = useFinanceData();
  
  // State for date range (Default: Current Month)
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const txDate = parseISO(t.date);
      return isWithinInterval(txDate, {
        start: parseISO(dateRange.start),
        end: parseISO(dateRange.end)
      });
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions, dateRange]);

  // Calculate Aggregates
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const expense = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Download PDF Handler
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Reporte Financiero', 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Generado el: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 28);
    doc.text(`Periodo: ${dateRange.start} al ${dateRange.end}`, 14, 33);

    // Summary Box
    doc.setDrawColor(200);
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 40, 180, 25, 'FD'); // x, y, w, h
    
    doc.setFontSize(12);
    doc.text('Resumen del Periodo', 18, 50);
    
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`Ingresos: $${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 18, 58);
    
    doc.setTextColor(244, 63, 94); // Red
    doc.text(`Gastos: -$${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 80, 58);
    
    doc.setTextColor(59, 130, 246); // Blue
    doc.text(`Neto: $${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 140, 58);

    doc.setTextColor(0); // Reset color

    // Table
    const tableData = filteredTransactions.map(t => [
      format(parseISO(t.date), 'dd/MM/yyyy'),
      t.counterparty || '-',
      t.description,
      t.type === 'INCOME' ? 'Ingreso' : 'Gasto',
      `$${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Fecha', 'Contraparte', 'Descripción', 'Tipo', 'Monto']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }, // Slate-900
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] } // Slate-50
    });

    doc.save(`finanzas_${dateRange.start}_${dateRange.end}.pdf`);
  };

  // Prepare Data for Composed Chart
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, { income: number, expense: number, net: number }> = {};
    
    // Sort transactions chronologically
    const sorted = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    
    sorted.forEach(t => {
      const amount = Number(t.amount);
      if (!groupedByDate[t.date]) groupedByDate[t.date] = { income: 0, expense: 0, net: 0 };
      
      if (t.type === 'INCOME') {
        groupedByDate[t.date].income += amount;
        groupedByDate[t.date].net += amount;
      } else {
        groupedByDate[t.date].expense += amount;
        groupedByDate[t.date].net -= amount;
      }
    });

    let cumulative = 0;
    return Object.keys(groupedByDate).sort().map(date => {
      cumulative += groupedByDate[date].net;
      return {
        date,
        income: Number(groupedByDate[date].income.toFixed(2)),
        expense: Number(groupedByDate[date].expense.toFixed(2)),
        balance: Number(cumulative.toFixed(2)),
        displayDate: format(parseISO(date), 'd MMM')
      };
    });
  }, [filteredTransactions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reportes y Análisis</h2>
          <p className="text-muted-foreground text-sm">Visualiza la evolución de tus finanzas en el tiempo.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-card border border-border p-1 rounded-xl shadow-sm w-full sm:w-auto overflow-x-auto">
              <div className="flex items-center px-3 py-1.5 gap-2 border-r border-border flex-1 sm:flex-none justify-center">
                  <Calendar size={16} className="text-muted-foreground shrink-0" />
                  <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent border-none text-sm text-foreground focus:ring-0 p-0 w-[105px]"
                  />
              </div>
              <span className="text-muted-foreground text-sm px-1 shrink-0">a</span>
              <div className="flex items-center px-3 py-1.5 gap-2 flex-1 sm:flex-none justify-center">
                  <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent border-none text-sm text-foreground focus:ring-0 p-0 w-[105px]"
                  />
              </div>
            </div>

            <button 
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border hover:bg-muted text-foreground rounded-xl text-sm font-medium transition-colors shadow-sm w-full sm:w-auto shrink-0"
            >
                <Download size={16} />
                <span>Exportar PDF</span>
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <TrendingUp className="text-emerald-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ingresos (Periodo)</p>
            <p className="text-2xl font-bold text-emerald-500">+${stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl">
            <TrendingDown className="text-rose-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gastos (Periodo)</p>
            <p className="text-2xl font-bold text-rose-500">-${stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Wallet className="text-blue-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Flujo Neto</p>
            <p className={cn("text-2xl font-bold", stats.balance >= 0 ? "text-blue-500" : "text-rose-500")}>
              {stats.balance >= 0 ? '+' : ''}${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* COMPOSED CHART */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm overflow-hidden">
        <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Análisis Financiero Completo
        </h3>
        
        {/* Scrollable Container for Mobile */}
        <div className="w-full overflow-x-auto pb-4">
          <div style={{ minWidth: Math.max(100, chartData.length * 35) + 'px', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  interval={0} 
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  formatter={(value, name) => [`$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                <Bar yAxisId="left" stackId="a" dataKey="income" name="Ingresos" fill="#10b981" barSize={20} radius={[0, 0, 4, 4]} />
                <Bar yAxisId="left" stackId="a" dataKey="expense" name="Gastos" fill="#f43f5e" barSize={20} radius={[4, 4, 0, 0]} />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="balance" 
                  name="Balance Acumulado" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2 md:hidden">
          ← Desliza para ver más historial →
        </p>
      </div>
    </div>
  );
}
