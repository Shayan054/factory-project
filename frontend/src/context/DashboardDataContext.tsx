import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../utils/api";
import { useAuth } from "./AuthContext";

export interface OrderDetail {
  order_detail_id: number;
  order_item: string;
  quantity: number;
  price: number;
  sub_total: number;
}

export interface Order {
  order_id: number;
  order_no: string;
  order_date: string;
  order_status: number;
  total_amount: number;
  discount: number;
  customer: number;
  order_details?: OrderDetail[];
}

export interface Customer {
  customer_id: number;
  name: string;
  contact: string;
  address: string;
}

export interface Billing {
  billing_id: number;
  total_bill: number;
  amount_received: number;
  balance: number;
  bill_date: string;
  order: number;
  customer: number;
}

export interface Expense {
  expense_id: number;
  date: string;
  amount: number;
  quantity: number | null;
  remarks: string;
  category: number;
  category_name?: string;
  category_name_display?: string;
}

type DashboardData = {
  orders: Order[];
  billings: Billing[];
  customers: Customer[];
  expenses: Expense[];
};

type DashboardDataContextValue = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  refresh: () => Promise<void>;
  ensureLoaded: () => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined);

const STALE_MS = 5 * 60 * 1000;

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, billingsRes, customersRes, expensesRes] = await Promise.all([
        apiRequest("/orders/"),
        apiRequest("/billings/"),
        apiRequest("/customers/"),
        apiRequest("/expenses/"),
      ]);

      if (!ordersRes.ok || !billingsRes.ok || !customersRes.ok || !expensesRes.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const [orders, billings, customers, expenses] = await Promise.all([
        ordersRes.json(),
        billingsRes.json(),
        customersRes.json(),
        expensesRes.json(),
      ]);

      setData({ orders, billings, customers, expenses });
      setLastFetchedAt(Date.now());
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (!isAuthenticated) return;
    await fetchDashboard();
  };

  const ensureLoaded = async () => {
    if (!isAuthenticated) return;

    const freshEnough =
      data &&
      lastFetchedAt !== null &&
      Date.now() - lastFetchedAt < STALE_MS;
    if (freshEnough) return;

    if (!inFlightRef.current) {
      inFlightRef.current = (async () => {
        try {
          await fetchDashboard();
        } finally {
          inFlightRef.current = null;
        }
      })();
    }
    await inFlightRef.current;
  };

  // Prefetch once when authenticated (first app open after login/refresh)
  useEffect(() => {
    if (isAuthenticated) {
      void ensureLoaded();
    } else {
      setData(null);
      setLastFetchedAt(null);
      setError(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      data,
      loading,
      error,
      lastFetchedAt,
      refresh,
      ensureLoaded,
    }),
    [data, loading, error, lastFetchedAt]
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardDataProvider");
  return ctx;
}

