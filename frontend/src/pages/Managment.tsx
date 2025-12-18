import { useEffect, useState } from "react";

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

const Management = () => {
  const [activeTab, setActiveTab] = useState<Entity>("customers");
  const [data, setData] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  /* ---------------- FETCH DATA ---------------- */
  const loadData = async (entity: Entity) => {
    const res = await fetch(`${API}/${entity}/`);
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab]);

  /* ---------------- DELETE ---------------- */
  const deleteItem = async (item: any) => {
    const id = getId(item);
    if (!id) return alert("Invalid record ID");

    if (!confirm("Are you sure you want to delete this record?")) return;

    await fetch(`${API}/${activeTab}/${id}/`, { method: "DELETE" });
    loadData(activeTab);
  };

  /* ---------------- UPDATE ---------------- */
  const updateItem = async () => {
    const id = getId(editingItem);
    if (!id) return alert("Invalid record ID");

    // remove primary key before sending update
    const payload = { ...editingItem };
    Object.keys(payload).forEach((k) => {
      if (isPrimaryKey(k)) delete payload[k];
    });

    await fetch(`${API}/${activeTab}/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setEditingItem(null);
    loadData(activeTab);
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
              {data[0] &&
                Object.keys(data[0]).map((key) => (
                  <th key={key} className="border p-2 text-left">
                    {key}
                  </th>
                ))}
              <th className="border p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr key={getId(item)}>
                {Object.keys(item).map((key) => (
                  <td key={key} className="border p-2">
                    {item[key]}
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
          </tbody>
        </table>
      </div>

      {/* -------- EDIT PANEL -------- */}
      {editingItem && (
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-3">Edit Record</h2>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.keys(editingItem).map((key) => (
              <input
                key={key}
                disabled={isPrimaryKey(key)}
                className={`border rounded-lg px-3 py-2 ${
                  isPrimaryKey(key) ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
                value={editingItem[key] ?? ""}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    [key]: e.target.value,
                  })
                }
              />
            ))}
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