import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import { Expense, Order, OrderDetail, Customer } from "../context/DashboardDataContext";

export type { Expense };

export type ReportStyle = "simple" | "detail";

const BRAND = {
  primary: [14, 165, 164] as [number, number, number],
  expense: [220, 53, 69] as [number, number, number],
  income: [22, 163, 74] as [number, number, number],
  dark: [31, 41, 55] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  rowAlt: [248, 250, 252] as [number, number, number],
};

const COMPANY_NAME = "Asghar Block Factory";

export function formatCurrencyPKR(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDatePK(value: string | Date) {
  try {
    return new Date(value).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export function formatPeriodLabel(startDate: string, endDate: string) {
  if (startDate && endDate) {
    return `${formatDatePK(startDate)} — ${formatDatePK(endDate)}`;
  }
  if (startDate) return `From ${formatDatePK(startDate)}`;
  if (endDate) return `Until ${formatDatePK(endDate)}`;
  return "All Time";
}

function getExpenseCategory(expense: Expense) {
  return expense.category_name || expense.category_name_display || "Unknown";
}

function parseDateOnly(value: string) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function filterExpensesByRange(expenses: Expense[], startDate: string, endDate: string) {
  return expenses.filter((expense) => {
    if (!expense.date) return false;
    const category = getExpenseCategory(expense).toLowerCase().trim();
    if (category === "production") return false;

    const expenseDate = parseDateOnly(expense.date);
    if (startDate) {
      const start = parseDateOnly(startDate);
      if (expenseDate < start) return false;
    }
    if (endDate) {
      const end = parseDateOnly(endDate);
      end.setHours(23, 59, 59, 999);
      if (expenseDate > end) return false;
    }
    return true;
  });
}

export function filterOrdersByRange(orders: Order[], startDate: string, endDate: string) {
  return orders.filter((order) => {
    if (!order.order_date) return false;
    const orderDate = parseDateOnly(order.order_date);
    if (startDate) {
      const start = parseDateOnly(startDate);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const end = parseDateOnly(endDate);
      end.setHours(23, 59, 59, 999);
      if (orderDate > end) return false;
    }
    return true;
  });
}

function groupByDateKey<T>(items: T[], getDate: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = getDate(item).slice(0, 10);
    const list = map.get(key) || [];
    list.push(item);
    map.set(key, list);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function runAutoTable(doc: jsPDF, options: Record<string, unknown>) {
  if (typeof autoTable === "function") {
    autoTable(doc, options);
  } else {
    (doc as any).autoTable(options);
  }
  return (doc as any).lastAutoTable?.finalY ?? 0;
}

function addPageFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
    doc.text(COMPANY_NAME, 14, doc.internal.pageSize.getHeight() - 8);
  }
  doc.setTextColor(...BRAND.dark);
}

function createReportHeader(
  doc: jsPDF,
  title: string,
  accent: [number, number, number],
  meta: { period: string; reportStyle: string; extra?: string }
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(...BRAND.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(COMPANY_NAME, 14, 12);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 20);

  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(10);
  doc.text(`Period: ${meta.period}`, 14, 38);
  doc.text(`Report Type: ${meta.reportStyle}`, 14, 44);
  doc.text(`Generated: ${formatDatePK(new Date())}`, 14, 50);
  if (meta.extra) {
    doc.text(meta.extra, 14, 56);
    return 64;
  }
  return 58;
}

function addSummaryBox(doc: jsPDF, y: number, rows: [string, string][]) {
  const boxHeight = 8 + rows.length * 7;
  doc.setFillColor(...BRAND.rowAlt);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, boxHeight, 2, 2, "FD");

  let rowY = y + 8;
  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.muted);
    doc.text(label, 18, rowY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BRAND.dark);
    doc.text(value, 196, rowY, { align: "right" });
    rowY += 7;
  });

  return y + boxHeight + 8;
}

function addSectionTitle(doc: jsPDF, y: number, title: string) {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text(title, 14, y);
  return y + 6;
}

function savePdf(doc: jsPDF, fileName: string) {
  addPageFooter(doc);
  doc.save(fileName);
}

export function generateExpensePdf(
  expenses: Expense[],
  startDate: string,
  endDate: string,
  style: ReportStyle
) {
  const filtered = filterExpensesByRange(expenses, startDate, endDate);
  if (filtered.length === 0) return { ok: false as const, error: "No expenses found for the selected period." };

  const doc = new jsPDF();
  const grandTotal = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const period = formatPeriodLabel(startDate, endDate);

  let y = createReportHeader(doc, "Expense Report", BRAND.expense, {
    period,
    reportStyle: style === "simple" ? "Summary (by category)" : "Detailed (day-wise)",
    extra: `Total Entries: ${filtered.length}`,
  });

  y = addSummaryBox(doc, y, [
    ["Total Expenses", formatCurrencyPKR(grandTotal)],
    ["Categories", String(new Set(filtered.map(getExpenseCategory)).size)],
    ["Days with Expenses", String(new Set(filtered.map((e) => e.date.slice(0, 10))).size)],
  ]);

  if (style === "simple") {
    const categoryMap = new Map<string, { count: number; total: number }>();
    filtered.forEach((expense) => {
      const category = getExpenseCategory(expense);
      const current = categoryMap.get(category) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(expense.amount) || 0;
      categoryMap.set(category, current);
    });

    const body = [...categoryMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([category, data]) => [category, String(data.count), formatCurrencyPKR(data.total)]);

    y = addSectionTitle(doc, y, "Category Summary");
    y = runAutoTable(doc, {
      startY: y,
      head: [["Category", "Entries", "Total Amount"]],
      body,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: BRAND.expense, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: BRAND.rowAlt },
      foot: [["Grand Total", String(filtered.length), formatCurrencyPKR(grandTotal)]],
      footStyles: { fillColor: [254, 226, 226], textColor: BRAND.dark, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    }) + 6;
  } else {
    const byDay = groupByDateKey(filtered, (e) => e.date);

    byDay.forEach(([dateKey, dayExpenses]) => {
      const dayTotal = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      y = addSectionTitle(doc, y, `${formatDatePK(dateKey)} — Day Total: ${formatCurrencyPKR(dayTotal)}`);

      const body = dayExpenses
        .sort((a, b) => getExpenseCategory(a).localeCompare(getExpenseCategory(b)))
        .map((expense) => [
          getExpenseCategory(expense),
          formatCurrencyPKR(Number(expense.amount) || 0),
          expense.quantity != null ? String(expense.quantity) : "—",
          expense.remarks?.trim() || "—",
        ]);

      y = runAutoTable(doc, {
        startY: y,
        head: [["Category", "Amount", "Qty", "Remarks"]],
        body,
        styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
        headStyles: { fillColor: BRAND.expense, textColor: BRAND.white, fontStyle: "bold" },
        alternateRowStyles: { fillColor: BRAND.rowAlt },
        columnStyles: { 3: { cellWidth: 70 } },
        margin: { left: 14, right: 14 },
      }) + 8;
    });
  }

  const fileName = `Expense_Report_${style}_${startDate || "all"}_${endDate || "time"}.pdf`;
  savePdf(doc, fileName);
  return { ok: true as const };
}

export async function generateIncomePdf(
  orders: Order[],
  customers: Customer[],
  startDate: string,
  endDate: string,
  style: ReportStyle
) {
  const ordersWithDetails = filterOrdersByRange(orders, startDate, endDate);
  if (ordersWithDetails.length === 0) {
    return { ok: false as const, error: "No income (orders) found for the selected period." };
  }

  const doc = new jsPDF();
  const grandTotal = ordersWithDetails.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  const period = formatPeriodLabel(startDate, endDate);

  let y = createReportHeader(doc, "Income Report", BRAND.income, {
    period,
    reportStyle: style === "simple" ? "Summary (by product)" : "Detailed (day-wise)",
    extra: `Total Orders: ${ordersWithDetails.length}`,
  });

  y = addSummaryBox(doc, y, [
    ["Total Income", formatCurrencyPKR(grandTotal)],
    ["Completed Orders", String(ordersWithDetails.filter((o) => o.order_status === 1).length)],
    ["Pending Orders", String(ordersWithDetails.filter((o) => o.order_status === 0).length)],
  ]);

  if (style === "simple") {
    const productMap = new Map<string, { qty: number; total: number }>();

    ordersWithDetails.forEach((order) => {
      if (order.order_details?.length) {
        order.order_details.forEach((detail: OrderDetail) => {
          const name = detail.order_item || "Unknown";
          const current = productMap.get(name) || { qty: 0, total: 0 };
          current.qty += Number(detail.quantity) || 0;
          current.total += Number(detail.sub_total) || 0;
          productMap.set(name, current);
        });
      } else {
        const name = "Unspecified";
        const current = productMap.get(name) || { qty: 0, total: 0 };
        current.qty += 1;
        current.total += Number(order.total_amount) || 0;
        productMap.set(name, current);
      }
    });

    const body = [...productMap.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .map(([product, data]) => [product, String(data.qty), formatCurrencyPKR(data.total)]);

    y = addSectionTitle(doc, y, "Product Summary");
    runAutoTable(doc, {
      startY: y,
      head: [["Product", "Quantity Sold", "Total Income"]],
      body,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: BRAND.income, textColor: BRAND.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: BRAND.rowAlt },
      foot: [["Grand Total", "", formatCurrencyPKR(grandTotal)]],
      footStyles: { fillColor: [220, 252, 231], textColor: BRAND.dark, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
  } else {
    const byDay = groupByDateKey(ordersWithDetails, (o) => o.order_date);

    byDay.forEach(([dateKey, dayOrders]) => {
      const dayTotal = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      y = addSectionTitle(doc, y, `${formatDatePK(dateKey)} — Day Total: ${formatCurrencyPKR(dayTotal)}`);

      const body = dayOrders.map((order) => {
        const customer = customers.find((c) => c.customer_id === order.customer);
        const items =
          order.order_details?.map((d) => `${d.order_item} (${d.quantity})`).join(", ") || "—";
        return [
          order.order_no || `#${order.order_id}`,
          customer?.name || "Unknown",
          items,
          order.order_status === 1 ? "Completed" : "Pending",
          formatCurrencyPKR(Number(order.total_amount) || 0),
        ];
      });

      y = runAutoTable(doc, {
        startY: y,
        head: [["Order No", "Customer", "Items", "Status", "Amount"]],
        body,
        styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
        headStyles: { fillColor: BRAND.income, textColor: BRAND.white, fontStyle: "bold" },
        alternateRowStyles: { fillColor: BRAND.rowAlt },
        columnStyles: { 2: { cellWidth: 55 } },
        margin: { left: 14, right: 14 },
      }) + 8;
    });
  }

  const fileName = `Income_Report_${style}_${startDate || "all"}_${endDate || "time"}.pdf`;
  savePdf(doc, fileName);
  return { ok: true as const };
}
