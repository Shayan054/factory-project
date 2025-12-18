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

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, billingsRes, customersRes] = await Promise.all([
        apiRequest('/orders/'),
        apiRequest('/billings/'),
        apiRequest('/customers/'),
      ]);
      
      const ordersData = await ordersRes.json();
      const billingsData = await billingsRes.json();
      const customersData = await customersRes.json();
      
      setOrders(ordersData);
      setBillings(billingsData);
      setCustomers(customersData);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
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
