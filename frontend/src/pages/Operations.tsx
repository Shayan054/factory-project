import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000/api";

/* ---------- UI CLASSES ---------- */
const sectionBtn =
  "w-full text-left px-6 py-4 rounded-xl bg-gray-100 hover:bg-indigo-100 font-semibold text-lg transition";
const card = "bg-white p-6 rounded-2xl shadow space-y-4";
const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
const primaryBtn =
  "bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition";

/* ---------- TYPES ---------- */
type Customer = { id: number; name: string; contact: string };
type Product = { id: number; product_name: string; price?: number };
type Order = { id: number; customer: number; total_amount: number; order_status: number };

const Operations = () => {
  const [active, setActive] = useState<string | null>(null);

  /* ---------- MASTER DATA ---------- */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`${API}/customers/`).then(r => r.json()).then(setCustomers);
    fetch(`${API}/products/`).then(r => r.json()).then(setProducts);
    fetch(`${API}/orders/`).then(r => r.json()).then(setOrders);
  }, []);

  /* ---------- VENDOR ---------- */
  const [vendor, setVendor] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
  });

  /* ---------- RAW MATERIAL ---------- */
  const [raw, setRaw] = useState({
    material: "",
    measuring_unit: "",
    description: "",
    quantity: "",
    vendor: "",
  });

  /* ---------- PRODUCT ---------- */
  const [product, setProduct] = useState({
    product_name: "",
    description: "",
  });

  /* ---------- CUSTOMER ---------- */
  const [customer, setCustomer] = useState({
    name: "",
    contact: "",
    address: "",
    remark: "",
  });

  /* ---------- ORDER ---------- */
  const [orderForm, setOrderForm] = useState({
    customer: "",
    product: "",
    quantity: "",
    order_status: 0,
  });

  const selectedProduct = products.find(p => p.id === Number(orderForm.product));
  const subTotal = Number(orderForm.quantity) * (selectedProduct?.price ?? 0);

  /* ---------- BILLING ---------- */
  const [billing, setBilling] = useState({
    order: "",
    amount_received: "",
  });

  const selectedOrder = orders.find(o => o.id === Number(billing.order));
  const selectedCustomer = customers.find(c => c.id === selectedOrder?.customer);

  /* ---------- HELPERS ---------- */
  const post = async (url: string, data: any) => {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    alert("Saved successfully");
  };

  /* ---------- PLACE ORDER ---------- */
  const placeOrder = async () => {
    const orderRes = await fetch(`${API}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: orderForm.customer,
        order_status: orderForm.order_status,
        total_amount: subTotal,
      }),
    });

    const order = await orderRes.json();

    await fetch(`${API}/order-details/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: order.id,
        order_item: orderForm.product,
        quantity: orderForm.quantity,
        sub_total: subTotal,
      }),
    });

    alert("Order placed successfully");
  };

  /* ---------- BILLING ---------- */
  const generateBill = async () => {
    const received = Number(billing.amount_received);
    await post(`${API}/billings/`, {
      order: selectedOrder?.id,
      customer: selectedOrder?.customer,
      total_bill: selectedOrder?.total_amount,
      amount_received: received,
      balance: selectedOrder!.total_amount - received,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Operations</h1>

      {/* ---------- VENDOR ---------- */}
      <button className={sectionBtn} onClick={() => setActive("vendor")}>Add Vendor</button>
      {active === "vendor" && (
        <div className={card}>
          <input className={input} placeholder="Vendor Name" onChange={e => setVendor({ ...vendor, name: e.target.value })} />
          <input className={input} placeholder="Contact Person" onChange={e => setVendor({ ...vendor, contact_person: e.target.value })} />
          <input className={input} placeholder="Email" onChange={e => setVendor({ ...vendor, email: e.target.value })} />
          <input className={input} placeholder="Phone" onChange={e => setVendor({ ...vendor, phone: e.target.value })} />
          <button className={primaryBtn} onClick={() => post(`${API}/vendors/`, vendor)}>Save Vendor</button>
        </div>
      )}

      {/* ---------- RAW MATERIAL ---------- */}
      <button className={sectionBtn} onClick={() => setActive("raw")}>Add Raw Material</button>
      {active === "raw" && (
        <div className={card}>
          <input className={input} placeholder="Material" onChange={e => setRaw({ ...raw, material: e.target.value })} />
          <input className={input} placeholder="Unit" onChange={e => setRaw({ ...raw, measuring_unit: e.target.value })} />
          <input className={input} placeholder="Quantity" type="number" onChange={e => setRaw({ ...raw, quantity: e.target.value })} />
          <textarea className={input} placeholder="Description" onChange={e => setRaw({ ...raw, description: e.target.value })} />
          <input className={input} placeholder="Vendor ID" onChange={e => setRaw({ ...raw, vendor: e.target.value })} />
          <button className={primaryBtn} onClick={() => post(`${API}/raw-materials/`, raw)}>Save Raw Material</button>
        </div>
      )}

      {/* ---------- PRODUCT ---------- */}
      <button className={sectionBtn} onClick={() => setActive("product")}>Add Product</button>
      {active === "product" && (
        <div className={card}>
          <input className={input} placeholder="Product Name" onChange={e => setProduct({ ...product, product_name: e.target.value })} />
          <textarea className={input} placeholder="Description" onChange={e => setProduct({ ...product, description: e.target.value })} />
          <button className={primaryBtn} onClick={() => post(`${API}/products/`, product)}>Save Product</button>
        </div>
      )}

      {/* ---------- CUSTOMER ---------- */}
      <button className={sectionBtn} onClick={() => setActive("customer")}>Add Customer</button>
      {active === "customer" && (
        <div className={card}>
          <input className={input} placeholder="Name" onChange={e => setCustomer({ ...customer, name: e.target.value })} />
          <input className={input} placeholder="Contact" onChange={e => setCustomer({ ...customer, contact: e.target.value })} />
          <textarea className={input} placeholder="Address" onChange={e => setCustomer({ ...customer, address: e.target.value })} />
          <textarea className={input} placeholder="Remark" onChange={e => setCustomer({ ...customer, remark: e.target.value })} />
          <button className={primaryBtn} onClick={() => post(`${API}/customers/`, customer)}>Save Customer</button>
        </div>
      )}

      {/* ---------- PLACE ORDER ---------- */}
      <button className={sectionBtn} onClick={() => setActive("order")}>Place Order</button>
      {active === "order" && (
        <div className={card}>
          <select className={input} onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })}>
            <option>Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.contact})</option>
            ))}
          </select>

          <select className={input} onChange={e => setOrderForm({ ...orderForm, product: e.target.value })}>
            <option>Select Product</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.product_name}</option>
            ))}
          </select>

          <input className={input} type="number" placeholder="Quantity" onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} />

          <select className={input} onChange={e => setOrderForm({ ...orderForm, order_status: Number(e.target.value) })}>
            <option value={0}>Pending</option>
            <option value={1}>Completed</option>
          </select>

          <div className="font-semibold">Subtotal: {subTotal}</div>
          <button className={primaryBtn} onClick={placeOrder}>Place Order</button>
        </div>
      )}

      {/* ---------- BILLING ---------- */}
      <button className={sectionBtn} onClick={() => setActive("billing")}>Billing</button>
      {active === "billing" && selectedOrder && (
        <div className={card}>
          <select className={input} onChange={e => setBilling({ ...billing, order: e.target.value })}>
            <option>Select Order</option>
            {orders.map(o => (
              <option key={o.id} value={o.id}>Order #{o.id}</option>
            ))}
          </select>

          <div>Customer: {selectedCustomer?.name}</div>
          <div>Total Bill: {selectedOrder.total_amount}</div>

          <input className={input} type="number" placeholder="Amount Received"
            onChange={e => setBilling({ ...billing, amount_received: e.target.value })} />

          <div>Balance: {selectedOrder.total_amount - Number(billing.amount_received || 0)}</div>

          <button className={primaryBtn} onClick={generateBill}>Generate Bill</button>
        </div>
      )}
    </div>
  );
};

export default Operations;