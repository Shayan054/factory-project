import { loadDemoStore, nextId, saveDemoStore } from "./demoStore";
import type { DemoStore } from "./demoData";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parsePath(endpoint: string): { path: string; query: URLSearchParams } {
  const cleaned = endpoint.replace(/^\//, "").replace(/\/$/, "");
  const [pathPart, qs] = cleaned.split("?");
  return { path: pathPart || "", query: new URLSearchParams(qs || "") };
}

function paginate(items: any[], query: URLSearchParams) {
  const page = Math.max(1, Number(query.get("page") || 1));
  const pageSize = Math.max(1, Number(query.get("page_size") || 20));
  const search = (query.get("search") || "").trim().toLowerCase();

  let filtered = items;
  if (search) {
    filtered = items.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(search)
    );
  }

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);
  const hasNext = start + pageSize < filtered.length;
  return {
    count: filtered.length,
    next: hasNext ? `demo?page=${page + 1}` : null,
    previous: page > 1 ? `demo?page=${page - 1}` : null,
    results,
  };
}

function monthAbbr(m: number) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
    m - 1
  ];
}

function computeMetrics(store: DemoStore) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const activeOrders = store.orders.filter((o) => !o.is_deleted);

  const inMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  };
  const inYear = (iso: string) => new Date(iso).getFullYear() === year;

  const monthly_sales = activeOrders
    .filter((o) => inMonth(o.order_date))
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const annual_sales = activeOrders
    .filter((o) => inYear(o.order_date))
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const amount_received = store.billings.reduce(
    (s, b) => s + Number(b.amount_received || 0),
    0
  );
  const billedIds = new Set(store.billings.map((b) => b.order));
  const remaining_from_billings = store.billings.reduce(
    (s, b) => s + Number(b.balance || 0),
    0
  );
  const remaining_unbilled = activeOrders
    .filter((o) => !billedIds.has(o.order_id))
    .reduce((s, o) => s + Number(o.total_amount || 0), 0);

  const sales_chart = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const sales = activeOrders
      .filter((o) => {
        const d = new Date(o.order_date);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      })
      .reduce((s, o) => s + Number(o.total_amount || 0), 0);
    sales_chart.push({ month: monthAbbr(m), sales });
  }

  const expenseStart = new Date(now);
  expenseStart.setDate(expenseStart.getDate() - 730);

  const monthly_expenses = store.expenses
    .filter((e) => inMonth(e.date))
    .reduce((s, e) => s + Number(e.amount || 0), 0);
  const annual_expenses = store.expenses
    .filter((e) => inYear(e.date))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  return {
    monthly_sales,
    annual_sales,
    amount_received,
    remaining_amount: remaining_from_billings + remaining_unbilled,
    total_orders: activeOrders.length,
    pending_orders: activeOrders.filter((o) => o.order_status === 0).length,
    completed_orders: activeOrders.filter((o) => o.order_status === 1).length,
    monthly_expenses,
    annual_expenses,
    sales_chart,
    expense_chart_from: expenseStart.toISOString().slice(0, 10),
  };
}

function collectionKey(resource: string): keyof DemoStore | null {
  const map: Record<string, keyof DemoStore> = {
    customers: "customers",
    vendors: "vendors",
    products: "products",
    "raw-materials": "rawMaterials",
    "product-raw-materials": "productRawMaterials",
    orders: "orders",
    "order-details": "orderDetails",
    billings: "billings",
    "expense-categories": "expenseCategories",
    expenses: "expenses",
  };
  return map[resource] ?? null;
}

function idFieldFor(resource: string): string {
  const map: Record<string, string> = {
    customers: "customer_id",
    vendors: "vendor_id",
    products: "product_id",
    "raw-materials": "material_id",
    "product-raw-materials": "product_raw_material_id",
    orders: "order_id",
    "order-details": "order_detail_id",
    billings: "billing_id",
    "expense-categories": "category_id",
    expenses: "expense_id",
  };
  return map[resource] || "id";
}

function nextIdKey(resource: string): keyof DemoStore["nextIds"] {
  const map: Record<string, keyof DemoStore["nextIds"]> = {
    customers: "customers",
    vendors: "vendors",
    products: "products",
    "raw-materials": "rawMaterials",
    "product-raw-materials": "productRawMaterials",
    orders: "orders",
    "order-details": "orderDetails",
    billings: "billings",
    "expense-categories": "expenseCategories",
    expenses: "expenses",
  };
  return map[resource] || "orders";
}

function enrichOrder(store: DemoStore, order: any) {
  return {
    ...order,
    order_details: store.orderDetails.filter((d) => d.order === order.order_id),
  };
}

function enrichExpense(store: DemoStore, expense: any) {
  const cat = store.expenseCategories.find((c) => c.category_id === expense.category);
  return {
    ...expense,
    category_name_display: cat?.name,
    category_name: cat?.name,
  };
}

function enrichProduct(store: DemoStore, product: any) {
  return {
    ...product,
    raw_materials_used: store.productRawMaterials
      .filter((p) => p.product === product.product_id)
      .map((bom) => {
        const rm = store.rawMaterials.find((r) => r.material_id === bom.raw_material);
        return {
          ...bom,
          raw_material_name: rm?.material,
          raw_material_unit: rm?.measuring_unit,
        };
      }),
  };
}

async function readBody(options: RequestInit): Promise<any> {
  if (!options.body) return {};
  if (typeof options.body === "string") {
    try {
      return JSON.parse(options.body);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Handles all API traffic while Guest/Demo Mode is active.
 * Never reaches the Django backend.
 */
export async function handleDemoRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  const { path, query } = parsePath(endpoint);
  const store = loadDemoStore();
  const parts = path.split("/").filter(Boolean);

  // Dashboard metrics
  if (parts[0] === "dashboard" && parts[1] === "metrics" && method === "GET") {
    return jsonResponse(computeMetrics(store));
  }

  // Auth stubs (should not be called in guest mode)
  if (parts[0] === "auth") {
    return jsonResponse({ detail: "Not available in demo mode" }, 400);
  }

  const resource = parts[0];
  const idPart = parts[1];
  const collection = collectionKey(resource);

  if (!collection) {
    return jsonResponse({ detail: `Demo API: unknown resource '${resource}'` }, 404);
  }

  const idField = idFieldFor(resource);
  let items = store[collection] as any[];

  // Soft-deleted orders filter for list
  if (resource === "orders" && method === "GET" && !idPart) {
    items = items.filter((o) => !o.is_deleted);
  }

  // Expenses filters
  if (resource === "expenses" && method === "GET" && !idPart) {
    const dateFrom = query.get("date_from");
    if (dateFrom) {
      items = items.filter((e) => String(e.date) >= dateFrom);
    }
    items = items.map((e) => enrichExpense(store, e));
  }

  // LIST
  if (method === "GET" && !idPart) {
    if (resource === "orders") {
      items = items.map((o) => enrichOrder(store, o));
    }
    if (resource === "products") {
      items = items.map((p) => enrichProduct(store, p));
    }
    return jsonResponse(paginate(items, query));
  }

  // DETAIL
  if (method === "GET" && idPart) {
    const id = Number(idPart);
    let item = (store[collection] as any[]).find((x) => Number(x[idField]) === id);
    if (!item) return jsonResponse({ detail: "Not found" }, 404);
    if (resource === "orders") item = enrichOrder(store, item);
    if (resource === "products") item = enrichProduct(store, item);
    if (resource === "expenses") item = enrichExpense(store, item);
    return jsonResponse(item);
  }

  // CREATE
  if (method === "POST" && !idPart) {
    const body = await readBody(options);
    const newId = nextId(store, nextIdKey(resource));
    let created: any = { ...body, [idField]: newId };

    if (resource === "orders") {
      created = {
        ...created,
        order_id: newId,
        order_no: `ORD-DEMO-${1000 + newId}`,
        order_date: new Date().toISOString(),
        is_deleted: null,
      };
      // Deduct product stock for demo realism
      const detailBody = body; // order only; details come separately
      void detailBody;
    }

    if (resource === "order-details") {
      created = { ...created, order_detail_id: newId };
      const productId = Number(body.product);
      const qty = Number(body.quantity) || 0;
      const product = store.products.find((p) => p.product_id === productId);
      if (product && qty > 0) {
        product.quantity = Math.max(0, Number(product.quantity) - qty);
      }
    }

    if (resource === "billings") {
      created = {
        ...created,
        billing_id: newId,
        bill_date: created.bill_date || new Date().toISOString(),
        balance:
          created.balance ??
          Number(created.total_bill || 0) - Number(created.amount_received || 0),
      };
    }

    if (resource === "expenses") {
      let categoryId = body.category;
      if (body.category_name) {
        const name = String(body.category_name).trim();
        let cat = store.expenseCategories.find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        );
        if (!cat) {
          const cid = nextId(store, "expenseCategories");
          cat = { category_id: cid, name };
          store.expenseCategories.push(cat);
        }
        categoryId = cat.category_id;
      }
      created = {
        expense_id: newId,
        category: categoryId,
        date: body.date,
        amount: Number(body.amount) || 0,
        quantity: body.quantity ?? null,
        remarks: body.remarks || "",
      };
      created = enrichExpense(store, created);
    }

    if (resource === "expense-categories") {
      created = { category_id: newId, name: body.name };
    }

    if (resource === "raw-materials") {
      // Merge same material+vendor like backend
      const existing = store.rawMaterials.find(
        (rm) =>
          rm.material === body.material && Number(rm.vendor) === Number(body.vendor)
      );
      if (existing) {
        existing.quantity = Number(existing.quantity) + (Number(body.quantity) || 0);
        if (Number(body.price) > 0) existing.price = Number(body.price);
        saveDemoStore(store);
        return jsonResponse(existing, 200);
      }
      created = {
        material_id: newId,
        material: body.material,
        measuring_unit: body.measuring_unit,
        description: body.description || "",
        quantity: Number(body.quantity) || 0,
        price: Number(body.price) || 0,
        vendor: Number(body.vendor),
      };
      // Auto expense for raw purchase (mirrors backend demo behavior in UI)
      const catName = String(body.material);
      let cat = store.expenseCategories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase()
      );
      if (!cat) {
        const cid = nextId(store, "expenseCategories");
        cat = { category_id: cid, name: catName };
        store.expenseCategories.push(cat);
      }
      const eid = nextId(store, "expenses");
      store.expenses.push({
        expense_id: eid,
        category: cat.category_id,
        date: new Date().toISOString().slice(0, 10),
        amount: (Number(body.price) || 0) * (Number(body.quantity) || 0),
        quantity: Number(body.quantity) || 0,
        remarks: `Demo purchase of ${body.quantity} ${body.measuring_unit} ${body.material}`,
      });
    }

    if (resource === "customers") {
      created = {
        customer_id: newId,
        name: body.name,
        contact: body.contact,
        address: body.address || "",
        remark: body.remark || "",
        is_deleted: null,
        created_at: new Date().toISOString(),
      };
    }

    if (resource === "vendors") {
      created = {
        vendor_id: newId,
        name: body.name,
        contact_person: body.contact_person || "",
        email: body.email || "",
        phone: body.phone || "",
      };
    }

    if (resource === "products") {
      created = {
        product_id: newId,
        product_name: body.product_name,
        description: body.description || "",
        price: Number(body.price) || 0,
        quantity: Number(body.quantity) || 0,
      };
    }

    if (resource === "product-raw-materials") {
      created = {
        product_raw_material_id: newId,
        product: Number(body.product),
        raw_material: Number(body.raw_material),
        quantity_required: Number(body.quantity_required) || 0,
      };
    }

    (store[collection] as any[]).push(created);
    saveDemoStore(store);
    return jsonResponse(created, 201);
  }

  // UPDATE
  if ((method === "PUT" || method === "PATCH") && idPart) {
    const id = Number(idPart);
    const list = store[collection] as any[];
    const idx = list.findIndex((x) => Number(x[idField]) === id);
    if (idx < 0) return jsonResponse({ detail: "Not found" }, 404);
    const body = await readBody(options);
    list[idx] = { ...list[idx], ...body, [idField]: id };
    saveDemoStore(store);
    let item = list[idx];
    if (resource === "orders") item = enrichOrder(store, item);
    if (resource === "expenses") item = enrichExpense(store, item);
    return jsonResponse(item);
  }

  // DELETE
  if (method === "DELETE" && idPart) {
    const id = Number(idPart);
    const list = store[collection] as any[];
    const idx = list.findIndex((x) => Number(x[idField]) === id);
    if (idx < 0) return jsonResponse({ detail: "Not found" }, 404);

    if (resource === "orders") {
      list[idx] = { ...list[idx], is_deleted: 1 };
    } else {
      list.splice(idx, 1);
    }
    saveDemoStore(store);
    return jsonResponse({ ok: true }, 200);
  }

  return jsonResponse({ detail: `Demo API: unsupported ${method} ${path}` }, 405);
}
