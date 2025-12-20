import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

/* ---------- UI CLASSES ---------- */
const sectionBtn =
  "w-full text-left px-6 py-4 rounded-xl bg-gray-100 hover:bg-indigo-100 font-semibold text-lg transition";
const card = "bg-white p-6 rounded-2xl shadow space-y-4";
const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400";
const primaryBtn =
  "bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition";

/* ---------- TYPES ---------- */
type Customer = { customer_id: number; name: string; contact: string };
type Product = { product_id: number; product_name: string; price: number };
type Order = { 
  order_id: number; 
  customer: number; 
  total_amount: number; 
  order_status: number;
  order_no?: string;
  order_date?: string;
};
type OrderDetail = {
  order_detail_id: number;
  order_item: string;
  quantity: number;
  price: number;
  sub_total: number;
};
type Billing = {
  billing_id: number;
  customer: number;
  order: number;
  total_bill: number;
  amount_received: number;
  balance: number;
  bill_date: string;
};

const Operations = () => {
  const [active, setActive] = useState<string | null>(null);
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<number | null>(null);

  // Currency formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /* ---------- MASTER DATA ---------- */
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);

  useEffect(() => {
    apiRequest('/customers/').then(r => r.json()).then(setCustomers).catch(console.error);
    apiRequest('/products/').then(r => r.json()).then(setProducts).catch(console.error);
    apiRequest('/orders/').then(r => r.json()).then(setOrders).catch(console.error);
    apiRequest('/billings/').then(r => r.json()).then(setBillings).catch(console.error);
  }, []);

  // Refresh orders after placing new order
  const refreshOrders = () => {
    apiRequest('/orders/').then(r => r.json()).then(setOrders).catch(console.error);
  };

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
    price: "",
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

  const selectedProduct = products.find(p => p.product_id === Number(orderForm.product));
  const productPrice = selectedProduct?.price ?? 0;
  const subTotal = Number(orderForm.quantity) * productPrice;

  /* ---------- BILLING ---------- */
  const [billing, setBilling] = useState({
    order: "",
    amount_received: "",
  });

  // Auto-select last placed order if available
  useEffect(() => {
    if (lastPlacedOrderId && active === "billing") {
      setBilling({ ...billing, order: lastPlacedOrderId.toString() });
    }
  }, [lastPlacedOrderId, active]);

  const selectedOrder = orders.find(o => o.order_id === Number(billing.order));
  const selectedCustomer = customers.find(c => c.customer_id === selectedOrder?.customer);
  const orderDate = selectedOrder?.order_date 
    ? new Date(selectedOrder.order_date).toLocaleDateString() 
    : new Date().toLocaleDateString();

  /* ---------- HELPERS ---------- */
  const post = async (url: string, data: any) => {
    const response = await apiRequest(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      alert(`Error: ${JSON.stringify(error)}`);
      return null;
    }
    const result = await response.json();
    alert("Saved successfully");
    return result;
  };

  /* ---------- PLACE ORDER ---------- */
  const placeOrder = async () => {
    if (!orderForm.customer || !orderForm.product || !orderForm.quantity) {
      alert("Please fill all required fields");
      return;
    }

    if (Number(orderForm.quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    try {
      // Create order
      const orderData = {
        customer: Number(orderForm.customer),
        order_status: orderForm.order_status,
        total_amount: subTotal,
      };
      
      console.log("Sending order data:", orderData);
      
      const orderRes = await apiRequest('/orders/', {
        method: "POST",
        body: JSON.stringify(orderData),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json().catch(() => ({ detail: "Failed to create order" }));
        console.error("Order creation error:", errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const order = await orderRes.json();

      // Create order detail
      // Handle both 'order_id' and 'id' field names from API
      const orderId = order.order_id || order.id;
      const orderDetailRes = await apiRequest('/order-details/', {
        method: "POST",
        body: JSON.stringify({
          order: orderId,
          product: Number(orderForm.product),
          order_item: selectedProduct?.product_name || "",
          quantity: Number(orderForm.quantity),
          price: productPrice,
          sub_total: subTotal,
        }),
      });

      if (!orderDetailRes.ok) {
        const errorData = await orderDetailRes.json().catch(() => ({ detail: "Failed to create order detail" }));
        throw new Error(`Failed to create order detail: ${JSON.stringify(errorData)}`);
      }

      // Refresh orders list
      refreshOrders();
      
      // Reset form
      setOrderForm({
        customer: "",
        product: "",
        quantity: "",
        order_status: 0,
      });

      // Store order ID and navigate to billing (orderId already declared above)
      setLastPlacedOrderId(orderId);
      alert("Order placed successfully! Moving to billing...");
      setActive("billing");
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      alert(`Error placing order: ${errorMessage}`);
      console.error("Order placement error:", error);
    }
  };

  /* ---------- BILLING ---------- */
  const generateBill = async () => {
    if (!selectedOrder) {
      alert("Please select an order");
      return;
    }

    const received = Number(billing.amount_received);
    if (received < 0) {
      alert("Amount received cannot be negative");
      return;
    }

    if (received > selectedOrder.total_amount) {
      alert("Amount received cannot be greater than total bill");
      return;
    }

    try {
      const billingData = {
        order: selectedOrder.order_id,
        customer: selectedOrder.customer,
        total_bill: selectedOrder.total_amount,
        amount_received: received,
        balance: selectedOrder.total_amount - received,
      };

      const result = await post('/billings/', billingData);
      
      if (result) {
        // Refresh billings
        apiRequest('/billings/').then(r => r.json()).then(setBillings).catch(console.error);
        
        // Print receipt
        printReceipt(result);
        
        // Reset billing form
        setBilling({
          order: "",
          amount_received: "",
        });
        setLastPlacedOrderId(null);
      }
    } catch (error) {
      alert(`Error generating bill: ${error}`);
    }
  };

  /* ---------- PRINT RECEIPT ---------- */
  const printReceipt = (bill: Billing) => {
    const order = orders.find(o => o.order_id === bill.order);
    const customer = customers.find(c => c.customer_id === bill.customer);
    const orderDetails = order ? apiRequest(`/orders/${order.order_id}/`).then(r => r.json()) : null;

    // Format currency for receipt
    const formatReceiptCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        maximumFractionDigits: 0,
      }).format(amount);
    };

    // Create receipt content
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .info { margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .label { font-weight: bold; }
          .items { margin: 20px 0; }
          .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
          .total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #000; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #000; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTORY RECEIPT</h1>
          <p>Bill #${bill.billing_id}</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span class="label">Date:</span>
            <span>${new Date(bill.bill_date).toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="label">Customer:</span>
            <span>${customer?.name || "N/A"}</span>
          </div>
          <div class="info-row">
            <span class="label">Contact:</span>
            <span>${customer?.contact || "N/A"}</span>
          </div>
          ${order?.order_no ? `
          <div class="info-row">
            <span class="label">Order No:</span>
            <span>${order.order_no}</span>
          </div>
          ` : ""}
        </div>

        <div class="items">
          <div class="item-row">
            <span>Total Bill Amount:</span>
            <span>${formatReceiptCurrency(bill.total_bill)}</span>
          </div>
          <div class="item-row">
            <span>Amount Received:</span>
            <span>${formatReceiptCurrency(bill.amount_received)}</span>
          </div>
          <div class="item-row">
            <span>Balance:</span>
            <span>${formatReceiptCurrency(bill.balance)}</span>
          </div>
        </div>

        <div class="total">
          <div class="total-row">
            <span>Total Amount:</span>
            <span>${formatReceiptCurrency(bill.total_bill)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
            Print Receipt
          </button>
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      // Auto-print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Operations</h1>

      {/* ---------- VENDOR ---------- */}
      <button className={sectionBtn} onClick={() => setActive("vendor")}>Add Vendor</button>
      {active === "vendor" && (
        <div className={card}>
          <input className={input} placeholder="Vendor Name" value={vendor.name} onChange={e => setVendor({ ...vendor, name: e.target.value })} />
          <input className={input} placeholder="Contact Person" value={vendor.contact_person} onChange={e => setVendor({ ...vendor, contact_person: e.target.value })} />
          <input className={input} placeholder="Email" type="email" value={vendor.email} onChange={e => setVendor({ ...vendor, email: e.target.value })} />
          <input className={input} placeholder="Phone" value={vendor.phone} onChange={e => setVendor({ ...vendor, phone: e.target.value })} />
          <button className={primaryBtn} onClick={() => post('/vendors/', vendor).then(() => {
            setVendor({ name: "", contact_person: "", email: "", phone: "" });
          })}>Save Vendor</button>
        </div>
      )}

      {/* ---------- RAW MATERIAL ---------- */}
      <button className={sectionBtn} onClick={() => setActive("raw")}>Add Raw Material</button>
      {active === "raw" && (
        <div className={card}>
          <input className={input} placeholder="Material" value={raw.material} onChange={e => setRaw({ ...raw, material: e.target.value })} />
          <input className={input} placeholder="Unit" value={raw.measuring_unit} onChange={e => setRaw({ ...raw, measuring_unit: e.target.value })} />
          <input className={input} placeholder="Quantity" type="number" value={raw.quantity} onChange={e => setRaw({ ...raw, quantity: e.target.value })} />
          <textarea className={input} placeholder="Description" value={raw.description} onChange={e => setRaw({ ...raw, description: e.target.value })} />
          <input className={input} placeholder="Vendor ID" type="number" value={raw.vendor} onChange={e => setRaw({ ...raw, vendor: e.target.value })} />
          <button className={primaryBtn} onClick={() => post('/raw-materials/', raw).then(() => {
            setRaw({ material: "", measuring_unit: "", description: "", quantity: "", vendor: "" });
          })}>Save Raw Material</button>
        </div>
      )}

      {/* ---------- PRODUCT ---------- */}
      <button className={sectionBtn} onClick={() => setActive("product")}>Add Product</button>
      {active === "product" && (
        <div className={card}>
          <input className={input} placeholder="Product Name" value={product.product_name} onChange={e => setProduct({ ...product, product_name: e.target.value })} />
          <textarea className={input} placeholder="Description" value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} />
          <input className={input} placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} />
          <button className={primaryBtn} onClick={() => post('/products/', {
            product_name: product.product_name,
            description: product.description,
            price: Number(product.price) || 0,
          }).then(() => {
            setProduct({ product_name: "", description: "", price: "" });
          })}>Save Product</button>
        </div>
      )}

      {/* ---------- CUSTOMER ---------- */}
      <button className={sectionBtn} onClick={() => setActive("customer")}>Add Customer</button>
      {active === "customer" && (
        <div className={card}>
          <input className={input} placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
          <input className={input} placeholder="Contact" value={customer.contact} onChange={e => setCustomer({ ...customer, contact: e.target.value })} />
          <textarea className={input} placeholder="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
          <textarea className={input} placeholder="Remark" value={customer.remark} onChange={e => setCustomer({ ...customer, remark: e.target.value })} />
          <button className={primaryBtn} onClick={() => post('/customers/', customer).then(() => {
            setCustomer({ name: "", contact: "", address: "", remark: "" });
          })}>Save Customer</button>
        </div>
      )}

      {/* ---------- PLACE ORDER ---------- */}
      <button className={sectionBtn} onClick={() => setActive("order")}>Place Order</button>
      {active === "order" && (
        <div className={card}>
          <label className="block font-semibold mb-2">Customer *</label>
          <select 
            className={input} 
            value={orderForm.customer}
            onChange={e => setOrderForm({ ...orderForm, customer: e.target.value })}
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.contact})</option>
            ))}
          </select>

          <label className="block font-semibold mb-2 mt-4">Product Name *</label>
          <select 
            className={input} 
            value={orderForm.product}
            onChange={e => setOrderForm({ ...orderForm, product: e.target.value })}
          >
            <option value="">Select Product</option>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name} {p.price ? `- ${formatCurrency(p.price)}` : ""}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Price per unit: {formatCurrency(productPrice)}</div>
            </div>
          )}

          <label className="block font-semibold mb-2 mt-4">Quantity *</label>
          <input 
            className={input} 
            type="number" 
            placeholder="Quantity" 
            min="1"
            value={orderForm.quantity}
            onChange={e => setOrderForm({ ...orderForm, quantity: e.target.value })} 
          />

          <label className="block font-semibold mb-2 mt-4">Order Status</label>
          <select 
            className={input} 
            value={orderForm.order_status}
            onChange={e => setOrderForm({ ...orderForm, order_status: Number(e.target.value) })}
          >
            <option value={0}>Pending</option>
            <option value={1}>Completed</option>
          </select>

          {orderForm.product && orderForm.quantity && (
            <div className="bg-indigo-50 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Subtotal:</span>
                <span className="font-bold text-xl text-indigo-600">{formatCurrency(subTotal)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {orderForm.quantity} × {formatCurrency(productPrice)} = {formatCurrency(subTotal)}
              </div>
            </div>
          )}

          <button 
            className={`${primaryBtn} w-full mt-4`} 
            onClick={placeOrder}
            disabled={!orderForm.customer || !orderForm.product || !orderForm.quantity}
          >
            Place Order
          </button>
        </div>
      )}

      {/* ---------- BILLING ---------- */}
      <button className={sectionBtn} onClick={() => setActive("billing")}>Billing</button>
      {active === "billing" && (
        <div className={card}>
          <label className="block font-semibold mb-2">Select Order</label>
          <select 
            className={input} 
            value={billing.order}
            onChange={e => setBilling({ ...billing, order: e.target.value })}
          >
            <option value="">Select Order</option>
            {orders.map(o => (
              <option key={o.order_id} value={o.order_id}>
                {o.order_no || `Order #${o.order_id}`} - {customers.find(c => c.customer_id === o.customer)?.name || "Unknown"} ({formatCurrency(o.total_amount)})
              </option>
            ))}
          </select>

          {selectedOrder && selectedCustomer && (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Customer Name:</span>
                  <span>{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Total Price:</span>
                  <span className="text-lg font-bold text-indigo-600">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Date:</span>
                  <span>{orderDate}</span>
                </div>
                {selectedOrder.order_no && (
                  <div className="flex justify-between">
                    <span className="font-semibold">Order No:</span>
                    <span>{selectedOrder.order_no}</span>
                  </div>
                )}
              </div>

              <label className="block font-semibold mb-2 mt-4">Amount Paid *</label>
              <input 
                className={input} 
                type="number" 
                placeholder="Amount Received" 
                min="0"
                max={selectedOrder.total_amount}
                value={billing.amount_received}
                onChange={e => setBilling({ ...billing, amount_received: e.target.value })} 
              />

              {billing.amount_received && (
                <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Balance:</span>
                    <span className={`font-bold ${selectedOrder.total_amount - Number(billing.amount_received || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedOrder.total_amount - Number(billing.amount_received || 0))}
                    </span>
                  </div>
                </div>
              )}

              <button 
                className={`${primaryBtn} w-full mt-4`} 
                onClick={generateBill}
                disabled={!billing.amount_received || Number(billing.amount_received) < 0}
              >
                Generate Bill & Print Receipt
              </button>
            </>
          )}

          {!selectedOrder && billing.order && (
            <div className="text-red-600 mt-2">Order not found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Operations;
