import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";

// Currency formatter for PKR
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(amount);
};

type Entity = "customers" | "vendors" | "products" | "raw-materials" | "orders";

const ALLOWED_TABS: Entity[] = ["customers", "vendors", "products", "raw-materials", "orders"];

const parseTab = (tab: string | null): Entity =>
  ALLOWED_TABS.includes(tab as Entity) ? (tab as Entity) : "customers";

const getId = (item: any) => {
  const key = Object.keys(item).find(
    (k) => k.toLowerCase() === "id" || k.toLowerCase().endsWith("_id")
  );
  return key ? item[key] : null;
};

const isPrimaryKey = (key: string) =>
  key.toLowerCase().endsWith("id");

const isAuditField = (key: string) => {
  const k = key.toLowerCase();
  return (
    k === "created_at" ||
    k === "created_by" ||
    k === "updated_at" ||
    k === "updated_by" ||
    k === "is_deleted"
  );
};

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "";
  }
  
  // Handle arrays (like order_details)
  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    // If array contains objects, show count and summary
    if (typeof value[0] === "object") {
      return `${value.length} item(s)`;
    }
    return value.join(", ");
  }
  
  // Handle objects (like nested objects)
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  // Handle dates
  if (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return value;
    }
  }
  
  return String(value);
};

const Management = () => {
  const { isCEO } = useAuth();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const [data, setData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [amountReceived, setAmountReceived] = useState<string>(""); // For order editing
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSortKey, setOrderSortKey] = useState<"order_no" | "order_date" | "customer">("order_date");
  const [orderSortDir, setOrderSortDir] = useState<"asc" | "desc">("desc");

  /* ---------------- FETCH DATA ---------------- */
  const loadData = async (entity: Entity) => {
    const res = await apiRequest(`/${entity}/`);
    const json = await res.json();
    setData(json);
    
    // Load customers and billings for orders display
    if (entity === "orders") {
      const customersRes = await apiRequest('/customers/');
      const customersJson = await customersRes.json();
      setCustomers(customersJson);
      
      const billingsRes = await apiRequest('/billings/');
      const billingsJson = await billingsRes.json();
      setBillings(billingsJson);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const res = await apiRequest(`/${activeTab}/`);
      const json = await res.json();
      if (cancelled) return;
      setData(json);

      if (activeTab === "orders") {
        const [customersRes, billingsRes] = await Promise.all([
          apiRequest("/customers/"),
          apiRequest("/billings/"),
        ]);
        if (cancelled) return;
        setCustomers(await customersRes.json());
        setBillings(await billingsRes.json());
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  /* ---------------- DELETE ---------------- */
  const deleteItem = async (item: any) => {
    const id = getId(item);
    if (!id) return showModal("Error", "Invalid record ID");

    if (!confirm("Are you sure you want to delete this record?")) return;

    if (activeTab === "orders") {
      const resp = await apiRequest(`/orders/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_deleted: 1 }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        showModal("Error", `Failed to delete order.\n${JSON.stringify(err)}`);
        return;
      }
      showModal("Success", "Order deleted (soft delete).");
    } else {
      await apiRequest(`/${activeTab}/${id}/`, { method: "DELETE" });
    }
    loadData(activeTab);
  };

  /* ---------------- UPDATE ---------------- */
  const updateItem = async () => {
    const id = getId(editingItem);
    if (!id) return showModal("Error", "Invalid record ID");

    // remove primary key and order_no before sending update
    const payload = { ...editingItem };
    Object.keys(payload).forEach((k) => {
      if (isPrimaryKey(k) || k === "order_no" || isAuditField(k)) delete payload[k];
    });

    try {
      // If updating an order and amount_received is provided, update/create billing
      if (activeTab === "orders" && amountReceived) {
        const receivedAmount = Number(amountReceived);
        if (isNaN(receivedAmount) || receivedAmount < 0) {
          showModal("Invalid amount", "Invalid amount received. Please enter a valid number.");
          return;
        }

        const orderId = id;
        const order = data.find(o => {
          const oId = getId(o);
          return oId === orderId;
        });

        if (!order) {
          showModal("Error", "Order not found");
          return;
        }

        const totalAmount = order.total_amount || 0;
        if (receivedAmount > totalAmount) {
          showModal(
            "Invalid amount",
            `Amount received (${formatCurrency(receivedAmount)}) cannot exceed total amount (${formatCurrency(totalAmount)})`
          );
          return;
        }

        // Check if billing exists
        const existingBilling = getOrderBilling(orderId);
        
        if (existingBilling) {
          // Update existing billing - include order and customer as they're required
          const billingPayload = {
            order: orderId,
            customer: order.customer,
            total_bill: totalAmount,
            amount_received: receivedAmount,
            balance: totalAmount - receivedAmount,
          };

          const billingResponse = await apiRequest(`/billings/${existingBilling.billing_id}/`, {
            method: "PUT",
            body: JSON.stringify(billingPayload),
          });

          if (!billingResponse.ok) {
            const error = await billingResponse.json();
            showModal("Error updating billing", JSON.stringify(error));
            return;
          }
        } else {
          // Create new billing
          const billingPayload = {
            order: orderId,
            customer: order.customer,
            total_bill: totalAmount,
            amount_received: receivedAmount,
            balance: totalAmount - receivedAmount,
          };

          const billingResponse = await apiRequest('/billings/', {
            method: "POST",
            body: JSON.stringify(billingPayload),
          });

          if (!billingResponse.ok) {
            const error = await billingResponse.json();
            showModal("Error creating billing", JSON.stringify(error));
            return;
          }
        }
      }

      // Update the order
      const response = await apiRequest(`/${activeTab}/${id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        showModal("Error updating record", JSON.stringify(error));
        return;
      }

      setEditingItem(null);
      setAmountReceived("");
      loadData(activeTab);
      
      // If updating an order, refresh might be needed for dashboard
      if (activeTab === "orders") {
        // Trigger a custom event that dashboard can listen to
        window.dispatchEvent(new CustomEvent('ordersUpdated'));
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showModal("Error", "Error updating record. Please try again.");
    }
  };

  /* ---------------- ORDER SPECIFIC HELPERS ---------------- */
  const getOrderBilling = (orderId: number) => {
    return billings.find(b => {
      // Handle both order_id and id field names
      const orderIdFromOrder = orderId;
      return b.order === orderIdFromOrder;
    });
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.name} (${customer.contact})` : `Customer #${customerId}`;
  };

  const formatOrderStatus = (status: number) => {
    return status === 1 ? "Complete" : "Pending";
  };

  const filteredSortedOrders = useMemo(() => {
    if (activeTab !== "orders") return data;
    const q = orderSearch.trim().toLowerCase();

    const rows = data.filter((item) => {
      if (!q) return true;
      const orderId = item.order_id || item.id;
      const orderNo = String(item.order_no || `order #${orderId}`).toLowerCase();
      const customerName = getCustomerName(item.customer).toLowerCase();
      const orderDate = String(item.order_date || "").toLowerCase();
      return orderNo.includes(q) || customerName.includes(q) || orderDate.includes(q);
    });

    const dir = orderSortDir === "asc" ? 1 : -1;
    const safeStr = (v: any) => String(v ?? "").toLowerCase();
    const safeDate = (v: any) => {
      const d = v ? new Date(v) : null;
      const t = d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
      return t;
    };

    rows.sort((a, b) => {
      if (orderSortKey === "customer") {
        return safeStr(getCustomerName(a.customer)).localeCompare(safeStr(getCustomerName(b.customer))) * dir;
      }
      if (orderSortKey === "order_no") {
        return safeStr(a.order_no || a.order_id || a.id).localeCompare(safeStr(b.order_no || b.order_id || b.id)) * dir;
      }
      return (safeDate(a.order_date) - safeDate(b.order_date)) * dir;
    });

    return rows;
  }, [activeTab, data, orderSearch, orderSortKey, orderSortDir, customers]);

  const toggleOrderSort = (key: "order_no" | "order_date" | "customer") => {
    if (orderSortKey !== key) {
      setOrderSortKey(key);
      setOrderSortDir("asc");
      return;
    }
    setOrderSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Management</h1>
      <p className="text-gray-600">
        {isCEO 
          ? "View, edit, and delete factory records" 
          : "View factory records (Edit/Delete: CEO only)"}
      </p>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-4 text-sm text-[var(--muted-color)]">
        Select an option from the left <span className="font-semibold text-[var(--heading-color)]">Management</span> menu to manage that data.
      </div>

      {/* -------- TABLE -------- */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        {activeTab === "orders" && (
          <div className="flex items-center justify-end gap-2 p-3">
            <input
              className="w-full max-w-xs rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.25)]"
              placeholder="Search orders..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
            />
          </div>
        )}
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {activeTab === "orders" ? (
                <>
                  <th className="border p-2 text-left">
                    <button type="button" className="font-semibold hover:underline" onClick={() => toggleOrderSort("order_no")}>
                      Order No
                    </button>
                  </th>
                  <th className="border p-2 text-left">
                    <button type="button" className="font-semibold hover:underline" onClick={() => toggleOrderSort("customer")}>
                      Customer
                    </button>
                  </th>
                  <th className="border p-2 text-left">Total Amount</th>
                  <th className="border p-2 text-left">Discount</th>
                  <th className="border p-2 text-left">Amount Received</th>
                  <th className="border p-2 text-left">Remaining</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">
                    <button type="button" className="font-semibold hover:underline" onClick={() => toggleOrderSort("order_date")}>
                      Order Date
                    </button>
                  </th>
                  <th className="border p-2">Actions</th>
                </>
              ) : (
                <>
                  {data[0] &&
                    Object.keys(data[0])
                      .filter((key) => {
                        // Hide audit fields
                        if (isAuditField(key)) return false;
                        // Skip complex fields like arrays in table headers
                        const value = data[0][key];
                        if (Array.isArray(value)) {
                          return false;
                        }
                        return true;
                      })
                      .map((key) => (
                        <th key={key} className="border p-2 text-left">
                          {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </th>
                      ))}
                  <th className="border p-2">Actions</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {activeTab === "orders" ? (
              <>
                {filteredSortedOrders.map((item) => {
                  // Handle both order_id and id field names
                  const orderId = item.order_id || item.id;
                  const billing = getOrderBilling(orderId);
                  const amountReceived = billing?.amount_received || 0;
                  const remaining = billing ? billing.balance : item.total_amount;
                  
                  const discount = item.discount || 0;
                  const netAmount = (item.total_amount || 0) - discount;
                  
                  return (
                    <tr key={orderId}>
                      <td className="border p-2">{item.order_no || `Order #${orderId}`}</td>
                      <td className="border p-2">{getCustomerName(item.customer)}</td>
                      <td className="border p-2">{formatCurrency(item.total_amount)}</td>
                      <td className="border p-2">
                        {discount > 0 ? (
                          <span className="text-red-600 font-semibold">-{formatCurrency(discount)}</span>
                        ) : (
                          <span className="text-gray-400">No discount</span>
                        )}
                      </td>
                      <td className="border p-2">
                        {billing ? formatCurrency(amountReceived) : "Not Billed"}
                      </td>
                      <td className="border p-2">
                        <span className={remaining > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                          {formatCurrency(remaining)}
                        </span>
                      </td>
                      <td className="border p-2">
                        <span className={`px-2 py-1 rounded text-sm ${
                          item.order_status === 1 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {formatOrderStatus(item.order_status)}
                        </span>
                      </td>
                      <td className="border p-2">
                        {item.order_date ? formatCellValue(item.order_date) : "N/A"}
                      </td>
                      <td className="border p-2 space-x-2">
                        {isCEO && (
                          <>
                            <button
                              className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                              onClick={() => {
                                navigate(`/operations?tab=order&editOrderId=${orderId}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                              onClick={() => deleteItem(item)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {!isCEO && (
                          <span className="text-gray-500 text-sm">View Only</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-4 text-gray-500">
                      No orders found
                    </td>
                  </tr>
                )}
              </>
            ) : (
              <>
                {data.map((item) => (
                  <tr key={getId(item)}>
                    {Object.keys(item)
                      .filter((key) => {
                        // Hide audit fields
                        if (isAuditField(key)) return false;
                        // Skip complex fields like arrays in table cells (match header filtering)
                        const value = item[key];
                        if (Array.isArray(value)) {
                          return false;
                        }
                        return true;
                      })
                      .map((key) => (
                        <td key={key} className="border p-2">
                          {formatCellValue(item[key])}
                        </td>
                      ))}

                    <td className="border p-2 space-x-2">
                      <button
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                        onClick={() => setEditingItem(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => deleteItem(item)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center p-4 text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* -------- EDIT PANEL -------- */}
      {editingItem && isCEO && activeTab !== "orders" && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Edit Record</h2>

          {/* Show order_no as read-only for orders */}
          {activeTab === "orders" && editingItem.order_no && (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium mb-1">Order No (Read Only)</label>
                <input
                  disabled
                  className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                  value={editingItem.order_no}
                />
              </div>
              
              {/* Amount Received Field for Orders */}
              <div className="mb-4 p-3 bg-[rgba(14,165,164,0.10)] rounded-lg border border-[rgba(14,165,164,0.25)]">
                <label className="block text-sm font-medium mb-2">
                  Amount Received (PKR) *
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter amount customer paid"
                  min="0"
                  max={editingItem.total_amount || 0}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                />
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Total Amount:</span>
                    <span className="font-semibold">{formatCurrency(editingItem.total_amount || 0)}</span>
                  </div>
                  {amountReceived && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Amount Received:</span>
                        <span className="font-semibold text-[var(--accent-color)]">{formatCurrency(Number(amountReceived) || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span>Remaining:</span>
                        <span className={`font-semibold ${(editingItem.total_amount || 0) - (Number(amountReceived) || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency((editingItem.total_amount || 0) - (Number(amountReceived) || 0))}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(editingItem)
              .filter((key) => {
                // Skip complex fields like arrays and nested objects in edit form
                const value = editingItem[key];
                if (Array.isArray(value) || (typeof value === "object" && value !== null && !(value instanceof Date))) {
                  return false;
                }
                // Hide audit fields
                if (isAuditField(key)) {
                  return false;
                }
                // Skip order_no for orders
                if (activeTab === "orders" && key === "order_no") {
                  return false;
                }
                return true;
              })
              .map((key) => {
                const isDisabled = isPrimaryKey(key) || (activeTab === "orders" && key === "order_no");
                const isStatusField = activeTab === "orders" && key === "order_status";
                
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">
                      {key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </label>
                    {isStatusField ? (
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        value={editingItem[key]}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            [key]: Number(e.target.value),
                          })
                        }
                      >
                        <option value={0}>Pending</option>
                        <option value={1}>Complete</option>
                      </select>
                    ) : (
                      <input
                        disabled={isDisabled}
                        className={`w-full border rounded-lg px-3 py-2 ${
                          isDisabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        value={formatCellValue(editingItem[key])}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            [key]: e.target.value,
                          })
                        }
                      />
                    )}
                  </div>
                );
              })}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={updateItem}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Save Changes
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setAmountReceived("");
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;