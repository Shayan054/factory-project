// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Expense, useDashboardData } from "../context/DashboardDataContext";
import logo from "../assets/logo.png";

export default function Dashboard() {
  const { data, loading, error, ensureLoaded, refresh } = useDashboardData();
  const [expenseViewType, setExpenseViewType] = useState<'monthly' | 'yearly' | 'category'>('monthly');
  const [expenseStartDate, setExpenseStartDate] = useState<string>('');
  const [expenseEndDate, setExpenseEndDate] = useState<string>('');

  useEffect(() => {
    void ensureLoaded();
  }, []);

  // Refresh data when orders are updated (explicit event from other pages)
  useEffect(() => {
    const handleOrdersUpdate = () => {
      void refresh();
    };
    
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
    };
  }, []);

  const metrics = data?.metrics ?? null;
  const expenses = useMemo(() => data?.expenses ?? [], [data]);

  const monthlySales = metrics?.monthly_sales ?? 0;
  const annualSales = metrics?.annual_sales ?? 0;
  const amountReceived = metrics?.amount_received ?? 0;
  const remainingAmount = metrics?.remaining_amount ?? 0;
  const totalOrders = metrics?.total_orders ?? 0;
  const pendingOrders = metrics?.pending_orders ?? 0;
  const completedOrders = metrics?.completed_orders ?? 0;
  const monthlyExpenses = metrics?.monthly_expenses ?? 0;
  const annualExpenses = metrics?.annual_expenses ?? 0;
  const salesChartData = metrics?.sales_chart ?? [];

  const donutChartData: { name: string; value: number; color: string }[] = [
    { name: 'Completed', value: completedOrders, color: '#1cc88a' },
    { name: 'Pending', value: pendingOrders, color: '#f6c23e' },
  ];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter expenses by date range and exclude "production" category
  const getFilteredExpenses = () => {
    let filtered = expenses.filter(expense => {
      if (!expense.date) return false;
      
      // Exclude "production" category from calculations
      const categoryName = (expense.category_name || expense.category_name_display || '').toLowerCase().trim();
      if (categoryName === 'production') return false;
      
      try {
        const expenseDate = new Date(expense.date);
        // Reset time to compare dates only (not datetime)
        expenseDate.setHours(0, 0, 0, 0);
        
        if (expenseStartDate) {
          const startDate = new Date(expenseStartDate);
          startDate.setHours(0, 0, 0, 0);
          if (expenseDate < startDate) return false;
        }
        
        if (expenseEndDate) {
          const endDate = new Date(expenseEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (expenseDate > endDate) return false;
        }
        
        return true;
      } catch {
        return false;
      }
    });
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  // Expense calculations (excluding "production" category) — KPIs from server metrics above
  const getExpenseChartData = () => {
    if (expenseViewType === 'category') {
      // Category-wise data
      const categoryMap = new Map<string, number>();
      filteredExpenses.forEach(expense => {
        const category = expense.category_name || expense.category_name_display || 'Unknown';
        const current = categoryMap.get(category) || 0;
        categoryMap.set(category, current + (Number(expense.amount) || 0));
      });
      
      return Array.from(categoryMap.entries()).map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        expenses: value,
        fullName: name,
      }));
    } else if (expenseViewType === 'yearly') {
      // Yearly data - dynamically get all years from filtered expenses
      const yearMap = new Map<number, number>();
      filteredExpenses.forEach(expense => {
        if (!expense.date) return;
        try {
          const expenseDate = new Date(expense.date);
          const year = expenseDate.getFullYear();
          const current = yearMap.get(year) || 0;
          yearMap.set(year, current + (Number(expense.amount) || 0));
        } catch {
          return;
        }
      });
      
      // Get all years and sort
      const allYears = Array.from(yearMap.keys()).sort();
      
      // If no date filter, show last 10 years or all available years
      if (!expenseStartDate && !expenseEndDate) {
        const minYear = Math.max(currentYear - 9, allYears.length > 0 ? Math.min(...allYears) : currentYear - 9);
        const years: { year: string; expenses: number }[] = [];
        for (let year = minYear; year <= currentYear; year++) {
          years.push({
            year: year.toString(),
            expenses: yearMap.get(year) || 0,
          });
        }
        return years;
      } else {
        // If date filter is applied, show only years in the filtered range
        const years: { year: string; expenses: number }[] = [];
        allYears.forEach(year => {
          years.push({
            year: year.toString(),
            expenses: yearMap.get(year) || 0,
          });
        });
        return years;
      }
    } else {
      // Monthly data - show last 12 months dynamically
      const months: { month: string; expenses: number; fullDate: string }[] = [];
      
      // If date filter is applied, show months in that range
      if (expenseStartDate || expenseEndDate) {
        const startDate = expenseStartDate ? new Date(expenseStartDate) : new Date(currentYear, currentMonth - 11, 1);
        const endDate = expenseEndDate ? new Date(expenseEndDate) : new Date();
        
        startDate.setDate(1); // Start of month
        endDate.setDate(1); // Start of month
        
        const monthMap = new Map<string, number>();
        
        // Get all unique months from filtered expenses
        filteredExpenses.forEach(expense => {
          if (!expense.date) return;
          try {
            const expenseDate = new Date(expense.date);
            const monthKey = `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`;
            const current = monthMap.get(monthKey) || 0;
            monthMap.set(monthKey, current + (Number(expense.amount) || 0));
          } catch {
            return;
          }
        });
        
        // Generate all months in range
        const current = new Date(startDate);
        while (current <= endDate) {
          const monthKey = `${current.getFullYear()}-${current.getMonth()}`;
          const monthName = current.toLocaleString('default', { month: 'short' });
          const yearLabel = current.getFullYear() !== currentYear ? ` ${current.getFullYear().toString().slice(-2)}` : '';
          
          months.push({
            month: monthName + yearLabel,
            expenses: monthMap.get(monthKey) || 0,
            fullDate: `${monthName} ${current.getFullYear()}`,
          });
          
          // Move to next month
          current.setMonth(current.getMonth() + 1);
        }
        
        return months;
      } else {
        // No filter - show last 12 months from current date
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentYear, currentMonth - i, 1);
          const monthName = date.toLocaleString('default', { month: 'short' });
          const yearLabel = date.getFullYear() !== currentYear ? ` ${date.getFullYear().toString().slice(-2)}` : '';
          
          const monthExpenses = filteredExpenses
            .filter(expense => {
              if (!expense.date) return false;
              try {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === date.getMonth() && expenseDate.getFullYear() === date.getFullYear();
              } catch {
                return false;
              }
            })
            .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
          
          months.push({
            month: monthName + yearLabel,
            expenses: monthExpenses,
            fullDate: `${monthName} ${date.getFullYear()}`,
          });
        }
        
        return months;
      }
    }
  };

  const expenseChartData = getExpenseChartData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl text-gray-800">Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="var(--accent-color)"
          title="EARNINGS (MONTHLY)"
          value={formatCurrency(monthlySales)}
          icon={<CalendarIcon />}
        />
        <KpiCard
          accent="#1cc88a"
          title="EARNINGS (ANNUAL)"
          value={formatCurrency(annualSales)}
          icon={<DollarIcon />}
        />
        <KpiCard
          accent="#36b9cc"
          title="AMOUNT RECEIVED"
          value={formatCurrency(amountReceived)}
          icon={<MoneyIcon />}
        />
        <KpiCard
          accent="#f6c23e"
          title="REMAINING AMOUNT"
          value={formatCurrency(remainingAmount)}
          icon={<PendingIcon />}
        />
      </div>

      {/* Expense KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <KpiCard
          accent="#e74a3b"
          title="EXPENSES (MONTHLY)"
          value={formatCurrency(monthlyExpenses)}
          icon={<ExpenseIcon />}
        />
        <KpiCard
          accent="#dc3545"
          title="EXPENSES (ANNUAL)"
          value={formatCurrency(annualExpenses)}
          icon={<ExpenseIcon />}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales Overview (Area chart) */}
        <Card shellTitle="Sales Overview" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesChartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="var(--accent-color)" 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders Status (Donut chart) */}
        <Card shellTitle="Orders Status">
          <div className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, value, percent } = props;
                    return `${name || ''}: ${value || 0} (${((percent || 0) * 100).toFixed(0)}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {donutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-gray-800">Total: {totalOrders}</div>
              <div className="text-sm text-gray-600">Orders</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Expense Chart */}
      <div className="grid gap-4 lg:grid-cols-1">
        <Card shellTitle="Expenses Overview">
          <div className="mb-4 space-y-3">
            {/* View Type Selector */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setExpenseViewType('monthly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expenseViewType === 'monthly'
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setExpenseViewType('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expenseViewType === 'yearly'
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setExpenseViewType('category')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expenseViewType === 'category'
                    ? 'bg-[var(--accent-color)] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Category Wise
              </button>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={expenseStartDate}
                  onChange={(e) => setExpenseStartDate(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={expenseEndDate}
                  onChange={(e) => setExpenseEndDate(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]"
                />
              </div>
              <button
                onClick={() => {
                  setExpenseStartDate('');
                  setExpenseEndDate('');
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Clear Filter
              </button>
            </div>
          </div>

          {expenseViewType === 'category' ? (
            <div className="flex flex-col lg:flex-row items-start justify-center gap-6 min-h-[350px]">
              <div className="w-full lg:w-1/2 flex justify-center items-center">
                {expenseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="expenses"
                        paddingAngle={3}
                      >
                        {expenseChartData.map((entry: any, index: number) => {
                          const colors = [
                            '#8B5CF6', // Purple
                            '#EC4899', // Pink
                            '#F59E0B', // Amber
                            '#10B981', // Emerald
                            '#3B82F6', // Blue
                            '#EF4444', // Red
                            '#14B8A6', // Teal
                            '#F97316', // Orange
                            '#6366F1', // Indigo
                            '#84CC16', // Lime
                          ];
                          return (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#fff" strokeWidth={2} />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number | undefined, name: string, props: any) => {
                          const fullName = props.payload?.fullName || name;
                          return [
                            formatCurrency(value || 0),
                            fullName
                          ];
                        }}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          padding: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-500 text-center py-20">
                    No expense data available for the selected period
                  </div>
                )}
              </div>
              <div className="w-full lg:w-1/2">
                {expenseChartData.length > 0 ? (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                    {expenseChartData.map((entry: any, index: number) => {
                      const colors = [
                        '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
                        '#EF4444', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
                      ];
                      const total = expenseChartData.reduce((sum, e) => sum + (e.expenses || 0), 0);
                      const percentage = total > 0 ? ((entry.expenses / total) * 100).toFixed(1) : '0';
                      return (
                        <div 
                          key={index} 
                          className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition border border-gray-200"
                        >
                          <div 
                            className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm" 
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-bold text-gray-900 mb-1">
                              {entry.fullName || entry.name}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-[var(--accent-color)]">
                                {formatCurrency(entry.expenses)}
                              </span>
                              <span className="text-gray-600 font-medium">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm py-10">
                    No categories found
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={expenseChartData}>
                <defs>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="50%" stopColor="#EC4899" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey={expenseViewType === 'yearly' ? 'year' : 'month'} 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip 
                  formatter={(value: number | undefined) => formatCurrency(value || 0)}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    padding: '10px'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------- Building blocks ---------- */

function KpiCard({
  accent,
  title,
  value,
  icon,
}: {
  accent: string;
  title: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl bg-white shadow-sm">
      {/* left accent bar */}
      <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-xl" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between gap-4 p-5">
        <div>
          <div className="text-sl font-bold uppercase tracking-wide" style={{ color: accent }}>
            {title}
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-800">{value}</div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg text-gray-300 bg-gray-100">{icon}</div>
      </div>
    </div>
  );
}

function Card({
  shellTitle,
  className = "",
  children,
}: {
  shellTitle: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl bg-white shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold text-[var(--accent-color)]">{shellTitle}</h2>
        <button className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100" aria-label="More">
          <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
            <circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" />
          </svg>
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/* ---------- Icons ---------- */
function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v16H4V4h3V2zm13 6H4v10h16V8z" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M11 17.5V19h2v-1.5c2.33-.41 4-2.01 4-3.95 0-2.22-1.91-3.5-4.5-4.02L12 9.3c-1.94-.38-2.5-1.06-2.5-1.8 0-.86.8-1.5 2-1.5s2 .64 2 1.5h2c0-1.72-1.55-3.12-3.5-3.45V2h-2v1.55C7.67 3.96 6 5.56 6 7.5c0 2.18 1.89 3.5 4.5 4.02l.5.1c1.94.38 2.5 1.06 2.5 1.83 0 .85-.85 1.55-2 1.55s-2-.7-2-1.55H9c0 1.66 1.55 3.06 3.5 3.35z" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

function ExpenseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="currentColor" d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
    </svg>
  );
}
