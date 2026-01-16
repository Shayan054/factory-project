// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

interface OrderDetail {
  order_detail_id: number;
  order_item: string;
  quantity: number;
  price: number;
  sub_total: number;
}

interface Order {
  order_id: number;
  order_no: string;
  order_date: string;
  order_status: number;
  total_amount: number;
  discount: number;
  customer: number;
  order_details?: OrderDetail[];
}

interface Customer {
  customer_id: number;
  name: string;
  contact: string;
  address: string;
}

interface Billing {
  billing_id: number;
  total_bill: number;
  amount_received: number;
  balance: number;
  bill_date: string;
  order: number; // Order ID
  customer: number; // Customer ID
}

interface Expense {
  expense_id: number;
  date: string;
  amount: number;
  quantity: number | null;
  remarks: string;
  category: number;
  category_name?: string;
  category_name_display?: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseViewType, setExpenseViewType] = useState<'monthly' | 'yearly' | 'category'>('monthly');
  const [expenseStartDate, setExpenseStartDate] = useState<string>('');
  const [expenseEndDate, setExpenseEndDate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [ordersRes, billingsRes, customersRes, expensesRes] = await Promise.all([
        apiRequest('/orders/'),
        apiRequest('/billings/'),
        apiRequest('/customers/'),
        apiRequest('/expenses/'),
      ]);
      
      const ordersData = await ordersRes.json();
      const billingsData = await billingsRes.json();
      const customersData = await customersRes.json();
      const expensesData = await expensesRes.json();
      
      setOrders(ordersData);
      setBillings(billingsData);
      setCustomers(customersData);
      setExpenses(expensesData);
    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data when window gains focus or when orders are updated
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    
    const handleOrdersUpdate = () => {
      fetchData();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('ordersUpdated', handleOrdersUpdate);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('ordersUpdated', handleOrdersUpdate);
    };
  }, []);

  // Calculate metrics
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Monthly sales (from orders in current month)
  const monthlySales = orders
    .filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Annual sales (from orders in current year)
  const annualSales = orders
    .filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate.getFullYear() === currentYear;
    })
    .reduce((sum, order) => sum + (order.total_amount || 0), 0);

  // Amount received (from billings)
  const amountReceived = billings.reduce((sum, billing) => sum + (billing.amount_received || 0), 0);

  // Remaining amount calculation:
  // For orders with billing: use billing.balance
  // For orders without billing: use order.total_amount
  const remainingAmount = (() => {
    const ordersWithBilling = new Set(billings.map(b => b.order));
    let remaining = 0;
    
    orders.forEach(order => {
      if (ordersWithBilling.has(order.order_id)) {
        // Order has billing - use billing balance
        const billing = billings.find(b => b.order === order.order_id);
        if (billing) {
          remaining += billing.balance || 0;
        }
      } else {
        // Order has no billing - use full order amount
        remaining += order.total_amount || 0;
      }
    });
    
    return remaining;
  })();

  // Order statistics for donut chart
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.order_status === 0).length;
  const completedOrders = orders.filter(o => o.order_status === 1).length;

  // Sales chart data (last 6 months)
  const salesChartData: { month: string; sales: number }[] = (() => {
    const months: { month: string; sales: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const monthSales = orders
        .filter(order => {
          const orderDate = new Date(order.order_date);
          return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      months.push({
        month: monthName,
        sales: monthSales,
      });
    }
    return months;
  })();

  // Donut chart data
  const donutChartData: { name: string; value: number; color: string }[] = [
    { name: 'Completed', value: completedOrders, color: '#1cc88a' },
    { name: 'Pending', value: pendingOrders, color: '#f6c23e' },
  ];

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

  // Expense calculations (excluding "production" category)
  const monthlyExpenses = expenses
    .filter(expense => {
      if (!expense.date) return false;
      
      // Exclude "production" category
      const categoryName = (expense.category_name || expense.category_name_display || '').toLowerCase().trim();
      if (categoryName === 'production') return false;
      
      try {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  const annualExpenses = expenses
    .filter(expense => {
      if (!expense.date) return false;
      
      // Exclude "production" category
      const categoryName = (expense.category_name || expense.category_name_display || '').toLowerCase().trim();
      if (categoryName === 'production') return false;
      
      try {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    })
    .reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  // Expense chart data based on view type
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

  // Generate Expense PDF Report
  const generateExpenseReport = () => {
    try {
      if (filteredExpenses.length === 0) {
        alert('No expenses available for the selected period.');
        return;
      }

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Expense Report', 14, 20);
      
      // Date range
      doc.setFontSize(10);
      const dateRange = expenseStartDate && expenseEndDate
        ? `${new Date(expenseStartDate).toLocaleDateString('en-PK')} to ${new Date(expenseEndDate).toLocaleDateString('en-PK')}`
        : expenseStartDate
        ? `From ${new Date(expenseStartDate).toLocaleDateString('en-PK')}`
        : expenseEndDate
        ? `Until ${new Date(expenseEndDate).toLocaleDateString('en-PK')}`
        : 'All Time';
      doc.text(`Period: ${dateRange}`, 14, 30);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-PK')}`, 14, 37);

      // Category-wise summary
      const categoryMap = new Map<string, { total: number; count: number; items: Expense[] }>();
      filteredExpenses.forEach(expense => {
        const category = expense.category_name || expense.category_name_display || 'Unknown';
        const current = categoryMap.get(category) || { total: 0, count: 0, items: [] };
        current.total += Number(expense.amount) || 0;
        current.count += 1;
        current.items.push(expense);
        categoryMap.set(category, current);
      });

      // Summary table
      const summaryData: (string | number)[][] = Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .map(([category, data]) => [
          category,
          data.count,
          formatCurrency(data.total),
        ]);

      let yPos = 50;
      
      // Category Summary Table
      doc.setFontSize(12);
      doc.text('Category Summary', 14, yPos);
      yPos += 10;

      try {
        if (typeof autoTable === 'function') {
          autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Count', 'Total Amount']],
            body: summaryData,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [231, 74, 59] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          });
        } else {
          (doc as any).autoTable({
            startY: yPos,
            head: [['Category', 'Count', 'Total Amount']],
            body: summaryData,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [231, 74, 59] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          });
        }
        
        yPos = ((doc as any).lastAutoTable?.finalY || yPos) + 10;
      } catch (tableError) {
        console.error('Error creating summary table:', tableError);
        yPos += 20;
      }

      // Total
      const grandTotal = filteredExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ${formatCurrency(grandTotal)}`, 14, yPos);
      yPos += 15;

      // Detailed expenses by category
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([category, data]) => {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`${category} - Total: ${formatCurrency(data.total)}`, 14, yPos);
          yPos += 8;

          // Expense details table
          const detailData: (string | number)[][] = data.items.map((expense) => {
            const expenseDate = expense.date 
              ? new Date(expense.date).toLocaleDateString('en-PK')
              : 'N/A';
            return [
              expenseDate,
              formatCurrency(Number(expense.amount) || 0),
              expense.quantity ? expense.quantity.toString() : '-',
              expense.remarks || '-',
            ];
          });

          try {
            if (typeof autoTable === 'function') {
              autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Amount', 'Quantity', 'Remarks']],
                body: detailData,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [108, 117, 125] },
                margin: { left: 14 },
              });
            } else {
              (doc as any).autoTable({
                startY: yPos,
                head: [['Date', 'Amount', 'Quantity', 'Remarks']],
                body: detailData,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [108, 117, 125] },
                margin: { left: 14 },
              });
            }
            
            yPos = ((doc as any).lastAutoTable?.finalY || yPos) + 10;
          } catch (detailTableError) {
            console.error('Error creating detail table:', detailTableError);
            yPos += 20;
          }
        });

      // Save PDF
      const fileName = `Expense_Report_${expenseStartDate || 'all'}_${expenseEndDate || 'time'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error: unknown) {
      console.error('Error generating expense report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating report: ${errorMessage}. Please try again.`);
    }
  };

  // Generate PDF Report
  const generateReport = async () => {
    try {
      if (orders.length === 0) {
        alert('No orders available to generate report.');
        return;
      }

      // Fetch full order details with order_details
      const ordersWithDetails: Order[] = await Promise.all(
        orders.map(async (order) => {
          try {
            const orderRes = await apiRequest(`/orders/${order.order_id}/`);
            if (!orderRes.ok) {
              console.warn(`Failed to fetch order ${order.order_id}, status: ${orderRes.status}`);
              return order; // Return original order if fetch fails
            }
            const orderData = await orderRes.json();
            return orderData;
          } catch (error: unknown) {
            console.error(`Error fetching order ${order.order_id}:`, error);
            return order; // Return original order if error
          }
        })
      );

      if (ordersWithDetails.length === 0) {
        alert('No order data available to generate report.');
        return;
      }

      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Factory Orders Report', 14, 20);
      
      // Date
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-PK')}`, 14, 30);
      
      // Summary
      doc.setFontSize(12);
      doc.text(`Total Orders: ${totalOrders}`, 14, 40);
      doc.text(`Pending: ${pendingOrders} | Completed: ${completedOrders}`, 14, 47);
      doc.text(`Total Sales: ${formatCurrency(annualSales)}`, 14, 54);
      
      // Table data
      const tableData: (string | number)[][] = ordersWithDetails.map((order) => {
        const customer = customers.find(c => c.customer_id === order.customer);
        const status = order.order_status === 1 ? 'Completed' : 'Pending';
        const orderDate = order.order_date 
          ? new Date(order.order_date).toLocaleDateString('en-PK')
          : 'N/A';
        
        return [
          order.order_no || `#${order.order_id}`,
          customer?.name || 'Unknown',
          orderDate,
          status,
          formatCurrency(order.total_amount),
        ];
      });

      // Add table
      try {
        if (typeof autoTable === 'function') {
          autoTable(doc, {
            startY: 60,
            head: [['Order No', 'Customer', 'Date', 'Status', 'Total Amount']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [78, 115, 223] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          });
        } else {
          // Fallback: try as method
          (doc as any).autoTable({
            startY: 60,
            head: [['Order No', 'Customer', 'Date', 'Status', 'Total Amount']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [78, 115, 223] },
            alternateRowStyles: { fillColor: [245, 247, 250] },
          });
        }
      } catch (tableError) {
        console.error('Error creating table:', tableError);
        doc.text('Error creating orders table', 14, 60);
      }

      // Add order details section
      let yPos = tableData.length > 0 && (doc as any).lastAutoTable 
        ? ((doc as any).lastAutoTable.finalY + 15) 
        : 75;
      
      // If no table was created, start from a default position
      if (tableData.length === 0) {
        yPos = 60;
      }
      
      ordersWithDetails.forEach((order) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        const customer = customers.find(c => c.customer_id === order.customer);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `Order ${order.order_no || `#${order.order_id}`} - ${customer?.name || 'Unknown'}`,
          14,
          yPos
        );
        
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        if (order.order_details && order.order_details.length > 0) {
          const detailData: (string | number)[][] = order.order_details.map((detail: OrderDetail) => [
            detail.order_item,
            detail.quantity.toString(),
            formatCurrency(detail.price),
            formatCurrency(detail.sub_total),
          ]);

          try {
            if (typeof autoTable === 'function') {
              autoTable(doc, {
                startY: yPos,
                head: [['Item', 'Quantity', 'Price', 'Subtotal']],
                body: detailData,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [108, 117, 125] },
                margin: { left: 14 },
              });
            } else {
              // Fallback: try as method
              (doc as any).autoTable({
                startY: yPos,
                head: [['Item', 'Quantity', 'Price', 'Subtotal']],
                body: detailData,
                styles: { fontSize: 7 },
                headStyles: { fillColor: [108, 117, 125] },
                margin: { left: 14 },
              });
            }
            
            yPos = ((doc as any).lastAutoTable?.finalY || yPos) + 5;
          } catch (detailTableError) {
            console.error('Error creating detail table:', detailTableError);
            doc.text('Error creating order details table', 14, yPos);
            yPos += 10;
          }
        } else {
          doc.text('No order details available', 14, yPos);
          yPos += 7;
        }
        
        doc.text(`Total: ${formatCurrency(order.total_amount)}`, 14, yPos);
        doc.text(
          `Status: ${order.order_status === 1 ? 'Completed' : 'Pending'}`,
          14,
          yPos + 5
        );
        
        yPos += 15;
      });

      // Save PDF
      const fileName = `Orders_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    } catch (error: unknown) {
      console.error('Error generating report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error generating report: ${errorMessage}. Please try again.`);
    }
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
        <button
          onClick={generateReport}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-white shadow hover:opacity-90 transition"
          style={{ backgroundColor: "#4e73df" }}
        >
          <span className="text-sm">Generate Report</span>
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M5 20h14v-2H5v2zM12 2l4 4h-3v8h-2V6H8l4-4z" />
          </svg>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          accent="#4e73df"
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
                  <stop offset="5%" stopColor="#4e73df" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4e73df" stopOpacity={0}/>
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
                stroke="#4e73df" 
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
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setExpenseViewType('yearly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expenseViewType === 'yearly'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setExpenseViewType('category')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  expenseViewType === 'category'
                    ? 'bg-indigo-600 text-white'
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
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={expenseEndDate}
                  onChange={(e) => setExpenseEndDate(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              <button
                onClick={generateExpenseReport}
                className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                  <path d="M5 20h14v-2H5v2zM12 2l4 4h-3v8h-2V6H8l4-4z" />
                </svg>
                Download PDF
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
                              <span className="font-semibold text-indigo-600">
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
          <div className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
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
        <h2 className="font-semibold text-[#4e73df]">{shellTitle}</h2>
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
