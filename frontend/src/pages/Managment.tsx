import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

const API = "http://127.0.0.1:8000/api";

type Entity = "customers" | "vendors" | "products" | "raw-materials" | "orders";

const getId = (item: any) => {
  const key = Object.keys(item).find(
    (k) => k.toLowerCase() === "id" || k.toLowerCase().endsWith("_id")
  );
  return key ? item[key] : null;
};

const isPrimaryKey = (key: string) =>
  key.toLowerCase().endsWith("id");

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
  const [activeTab, setActiveTab] = useState<Entity>("customers");
  const [data, setData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);

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
    loadData(activeTab);
  }, [activeTab]);

  /* ---------------- DELETE ---------------- */
  const deleteItem = async (item: any) => {
    const id = getId(item);
    if (!id) return alert("Invalid record ID");

    if (!confirm("Are you sure you want to delete this record?")) return;

    await apiRequest(`/${activeTab}/${id}/`, { method: "DELETE" });
    loadData(activeTab);
  };

  /* ---------------- UPDATE ---------------- */
  const updateItem = async () => {
    const id = getId(editingItem);
    if (!id) return alert("Invalid record ID");

    // remove primary key and order_no before sending update
    const payload = { ...editingItem };
    Object.keys(payload).forEach((k) => {
      if (isPrimaryKey(k) || k === "order_no") delete payload[k];
    });

    await apiRequest(`/${activeTab}/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    setEditingItem(null);
    loadData(activeTab);
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

  /* ---------------- UI ---------------- */
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Management</h1>
      <p className="text-gray-600">View, edit, and delete factory records</p>

      {/* -------- TABS -------- */}
      <div className="flex gap-3 flex-wrap">
        {[
          ["customers", "Customers"],
          ["vendors", "Vendors"],
          ["products", "Products"],
          ["raw-materials", "Raw Materials"],
          ["orders", "Orders"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as Entity)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === key
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* -------- TABLE -------- */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {activeTab === "orders" ? (
                <>
                  <th className="border p-2 text-left">Order No</th>
                  <th className="border p-2 text-left">Customer</th>
                  <th className="border p-2 text-left">Total Amount</th>
                  <th className="border p-2 text-left">Amount Received</th>
                  <th className="border p-2 text-left">Remaining</th>
                  <th className="border p-2 text-left">Status</th>
                  <th className="border p-2 text-left">Order Date</th>
                  <th className="border p-2">Actions</th>
                </>
              ) : (
                <>
                  {data[0] &&
                    Object.keys(data[0])
                      .filter((key) => {
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
                {data.map((item) => {
                  // Handle both order_id and id field names
                  const orderId = item.order_id || item.id;
                  const billing = getOrderBilling(orderId);
                  const amountReceived = billing?.amount_received || 0;
                  const remaining = billing ? billing.balance : item.total_amount;
                  
                  return (
                    <tr key={orderId}>
                      <td className="border p-2">{item.order_no || `Order #${orderId}`}</td>
                      <td className="border p-2">{getCustomerName(item.customer)}</td>
                      <td className="border p-2">₹{item.total_amount}</td>
                      <td className="border p-2">
                        {billing ? `₹${amountReceived}` : "Not Billed"}
                      </td>
                      <td className="border p-2">
                        <span className={remaining > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                          ₹{remaining}
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
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
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
      {editingItem && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Edit Record</h2>

          {/* Show order_no as read-only for orders */}
          {activeTab === "orders" && editingItem.order_no && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium mb-1">Order No (Read Only)</label>
              <input
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                value={editingItem.order_no}
              />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(editingItem)
              .filter((key) => {
                // Skip complex fields like arrays and nested objects in edit form
                const value = editingItem[key];
                if (Array.isArray(value) || (typeof value === "object" && value !== null && !(value instanceof Date))) {
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
              onClick={() => setEditingItem(null)}
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