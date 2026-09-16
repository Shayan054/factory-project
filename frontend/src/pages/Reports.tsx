import { useState } from "react";
import { fetchAllPages, fetchList } from "../utils/listApi";
import { Customer, Expense, Order } from "../context/DashboardDataContext";
import { useModal } from "../context/ModalContext";
import {
  generateExpensePdf,
  generateIncomePdf,
  ReportStyle,
} from "../utils/pdfReports";

type ReportType = "expense" | "income";

const card =
  "bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/80 space-y-6";
const input =
  "w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";
const primaryBtn =
  "bg-[var(--accent-color)] text-white px-8 py-3 rounded-xl hover:bg-[var(--accent-color-hover)] transition disabled:opacity-50 disabled:cursor-not-allowed text-base font-semibold";

export default function Reports() {
  const { showModal } = useModal();

  const [reportType, setReportType] = useState<ReportType>("expense");
  const [reportStyle, setReportStyle] = useState<ReportStyle>("simple");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      showModal("Missing dates", "Please select both start and end dates for the report.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      showModal("Invalid range", "Start date cannot be after end date.");
      return;
    }

    setGenerating(true);
    try {
      if (reportType === "expense") {
        const expenses = await fetchList<Expense>("/expenses/", {
          date_from: startDate,
          date_to: endDate,
          exclude_production: "1",
          page_size: 500,
        });
        const result = generateExpensePdf(expenses, startDate, endDate, reportStyle);
        if (!result.ok) {
          showModal("No data", result.error);
          return;
        }
        showModal("Success", "Expense report downloaded successfully.");
        return;
      }

      const [orders, customers] = await Promise.all([
        fetchList<Order>("/orders/", {
          date_from: startDate,
          date_to: endDate,
          include_details: "1",
          page_size: 500,
        }),
        fetchAllPages<Customer>("/customers/"),
      ]);

      const result = await generateIncomePdf(
        orders,
        customers,
        startDate,
        endDate,
        reportStyle
      );
      if (!result.ok) {
        showModal("No data", result.error);
        return;
      }
      showModal("Success", "Income report downloaded successfully.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showModal("Error", `Failed to generate report: ${message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-2 py-4 sm:py-8">
      <div className="mb-6 w-full text-center">
        <h1 className="text-3xl font-semibold text-gray-800">Reports</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
          Generate PDF reports for expenses and income over a selected period.
        </p>
      </div>

      <div className={`${card} w-full`}>
        <div>
          <label className="block font-semibold mb-3">Report Category</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportType("expense")}
              className={`rounded-xl border-2 p-4 text-left transition ${
                reportType === "expense"
                  ? "border-[#dc3545] bg-red-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-800">Expense Report</div>
              <div className="text-xs text-gray-500 mt-1">
                Day-wise or category-wise spending
              </div>
            </button>
            <button
              type="button"
              onClick={() => setReportType("income")}
              className={`rounded-xl border-2 p-4 text-left transition ${
                reportType === "income"
                  ? "border-[#16a34a] bg-green-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-bold text-gray-800">Income Report</div>
              <div className="text-xs text-gray-500 mt-1">
                Sales and order revenue summary
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-3">Report Style</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportStyle("simple")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                reportStyle === "simple"
                  ? "border-[var(--accent-color)] bg-[rgba(14,165,164,0.08)] text-[var(--accent-color)]"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Simple Report
              <div className="text-xs font-normal text-gray-500 mt-0.5">
                {reportType === "expense"
                  ? "Totals by category (e.g. Cement, Diesel)"
                  : "Totals by product sold"}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setReportStyle("detail")}
              className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                reportStyle === "detail"
                  ? "border-[var(--accent-color)] bg-[rgba(14,165,164,0.08)] text-[var(--accent-color)]"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Detailed Report
              <div className="text-xs font-normal text-gray-500 mt-0.5">
                Day-by-day breakdown with line items
              </div>
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              className={input}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              className={input}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[rgba(14,165,164,0.2)] bg-[rgba(14,165,164,0.06)] p-4 text-sm text-gray-700">
          {reportType === "expense" && reportStyle === "simple" && (
            <p>
              <strong>Simple expense report</strong> shows each category with entry count and total
              amount, plus a grand total at the bottom.
            </p>
          )}
          {reportType === "expense" && reportStyle === "detail" && (
            <p>
              <strong>Detailed expense report</strong> groups expenses by day. Each day shows
              category, amount, quantity, and remarks with a daily total.
            </p>
          )}
          {reportType === "income" && reportStyle === "simple" && (
            <p>
              <strong>Simple income report</strong> shows total revenue per product with quantity
              sold and overall income total.
            </p>
          )}
          {reportType === "income" && reportStyle === "detail" && (
            <p>
              <strong>Detailed income report</strong> groups orders by day with customer, items,
              status, and amount for each order.
            </p>
          )}
        </div>

        <div className="flex justify-center pt-1">
          <button
            type="button"
            className={`${primaryBtn} inline-flex items-center gap-2`}
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M5 20h14v-2H5v2zM12 2l4 4h-3v8h-2V6H8l4-4z" />
            </svg>
            {generating ? "Generating..." : "Download PDF Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
