import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useSearchParams } from "react-router-dom";
import { useModal } from "../context/ModalContext";

/* ---------- UI CLASSES ---------- */
const card = "bg-white p-6 rounded-2xl shadow space-y-4";
const input =
  "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.35)] focus:border-[var(--accent-color)]";
const primaryBtn =
  "bg-[var(--accent-color)] text-white px-6 py-2 rounded-lg hover:bg-[var(--accent-color-hover)] transition";

/* ---------- TYPES ---------- */
type Customer = { customer_id: number; name: string; contact: string };
type Product = { product_id: number; product_name: string; price: number; quantity: number };
type Order = { 
  order_id: number; 
  customer: number; 
  total_amount: number; 
  discount: number;
  order_status: number;
  order_no?: string;
  order_date?: string;
  total_bill_after_discount?: number | null;
  order_req_date?: string | null;
  total_item_quantity?: number | null;
  status?: string | null;
  notes?: string | null;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [lastPlacedOrderId, setLastPlacedOrderId] = useState<number | null>(null);
  const { showModal } = useModal();

  // Always derive the active tab from the URL, so it can't go out of sync
  const active = searchParams.get("tab");

  const setActiveTab = (tab: string | null) => {
    if (!tab) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("tab");
        return next;
      });
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

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
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    apiRequest('/customers/').then(r => r.json()).then(setCustomers).catch(console.error);
    apiRequest('/products/').then(r => r.json()).then(setProducts).catch(console.error);
    apiRequest('/orders/').then(r => r.json()).then(setOrders).catch(console.error);
    apiRequest('/billings/').then(r => r.json()).then(setBillings).catch(console.error);
    apiRequest('/raw-materials/').then(r => r.json()).then(setRawMaterials).catch(console.error);
    apiRequest('/vendors/').then(r => r.json()).then(setVendors).catch(console.error);
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
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [raw, setRaw] = useState({
    material: "",
    measuring_unit: "",
    description: "",
    quantity: "",
    price: "",
    vendor: "",
  });

  /* ---------- PRODUCT ---------- */
  const [product, setProduct] = useState({
    product_name: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [productRawMaterials, setProductRawMaterials] = useState<Array<{
    raw_material: string;
    quantity_required: string;
  }>>([{ raw_material: "", quantity_required: "" }]);

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
    discount: "",
    order_req_date: "",
    status: "",
    notes: "",
  });

  const editOrderIdParam = searchParams.get("editOrderId");
  const editOrderId = editOrderIdParam ? Number(editOrderIdParam) : null;
  const isEditMode = active === "order" && Number.isFinite(editOrderId as any) && !!editOrderId;
  const [editBillingId, setEditBillingId] = useState<number | null>(null);
  const [editOrderDetailId, setEditOrderDetailId] = useState<number | null>(null);

  type DraftOrder = {
    customerId: number;
    productId: number;
    productName: string;
    productUnitPrice: number;
    quantity: number;
    discount: number;
    order_status: number;
    order_req_date: string | null; // ISO string
    status: string | null;
    notes: string | null;
    total_amount: number;
    total_bill_after_discount: number;
  };

  const [draftOrder, setDraftOrder] = useState<DraftOrder | null>(null);

  // Persist draft order across query changes / refreshes (session only)
  useEffect(() => {
    try {
      if (draftOrder) {
        sessionStorage.setItem("draft_order", JSON.stringify(draftOrder));
      } else {
        sessionStorage.removeItem("draft_order");
      }
    } catch {
      // ignore storage errors
    }
  }, [draftOrder]);

  useEffect(() => {
    try {
      if (!draftOrder) {
        const raw = sessionStorage.getItem("draft_order");
        if (raw) setDraftOrder(JSON.parse(raw));
      }
    } catch {
      // ignore parse/storage errors
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProduct = products.find(p => p.product_id === Number(orderForm.product));
  const productPrice = selectedProduct?.price ?? 0;
  const subTotal = Number(orderForm.quantity) * productPrice;
  const orderDiscount = Number(orderForm.discount) || 0;
  const totalAfterDiscount = Math.max(subTotal - orderDiscount, 0);
  const availableQty = selectedProduct?.quantity ?? null;
  const requestedQty = Number(orderForm.quantity) || 0;
  const isQtyInsufficient = availableQty !== null && requestedQty > 0 && requestedQty > availableQty;

  /* ---------- BILLING ---------- */
  const [billing, setBilling] = useState({
    order: "",
    amount_received: "",
    payment_method: "",
    status: "",
    remarks: "",
  });

  useEffect(() => {
    const loadEditData = async () => {
      if (!isEditMode || !editOrderId) return;
      try {
        // Load order
        const orderRes = await apiRequest(`/orders/${editOrderId}/`);
        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({}));
          showModal("Error", `Failed to load order.\n${JSON.stringify(err)}`);
          return;
        }
        const order = await orderRes.json();

        // Load order-details and pick the first detail for editing
        const odRes = await apiRequest(`/order-details/`);
        const odJson = odRes.ok ? await odRes.json() : [];
        const details = Array.isArray(odJson) ? odJson.filter((d: any) => d.order === editOrderId) : [];
        const firstDetail = details[0] || null;
        setEditOrderDetailId(firstDetail?.order_detail_id ?? null);

        setOrderForm({
          customer: String(order.customer ?? ""),
          product: String(firstDetail?.product ?? ""),
          quantity: String(firstDetail?.quantity ?? ""),
          order_status: Number(order.order_status ?? 0),
          discount: String(order.discount ?? ""),
          order_req_date: order.order_req_date ? String(order.order_req_date).slice(0, 10) : "",
          status: order.status ?? "",
          notes: order.notes ?? "",
        });

        // Load billing (if exists)
        const bRes = await apiRequest(`/billings/`);
        const bJson = bRes.ok ? await bRes.json() : [];
        const b = Array.isArray(bJson) ? bJson.find((x: any) => x.order === editOrderId) : null;
        setEditBillingId(b?.billing_id ?? null);
        setBilling({
          order: String(editOrderId),
          amount_received: b?.amount_received != null ? String(b.amount_received) : "",
          payment_method: b?.payment_method ?? "",
          status: b?.status ?? "",
          remarks: b?.remarks ?? "",
        });
      } catch (e: any) {
        showModal("Error", e?.message || String(e));
      }
    };

    void loadEditData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editOrderId]);

  /* ---------- EXPENSE ---------- */
  const [expense, setExpense] = useState({
    category_name: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    quantity: "",
    remarks: "",
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
      showModal("Error", JSON.stringify(error));
      return null;
    }
    const result = await response.json();
    showModal("Success", "Saved successfully.");
    return result;
  };

  /* ---------- CONFIRM (IN-MEMORY) ORDER ---------- */
  const confirmOrder = async () => {
    if (!orderForm.customer || !orderForm.product || !orderForm.quantity) {
      showModal("Missing fields", "Please fill all required fields.");
      return;
    }

    if (Number(orderForm.quantity) <= 0) {
      showModal("Invalid quantity", "Quantity must be greater than 0.");
      return;
    }

    try {
      if (isQtyInsufficient) {
        showModal(
          "Low inventory",
          `Only ${availableQty} available for ${selectedProduct?.product_name || "this product"}.`
        );
        return;
      }

      // Save in memory only, then move to billing
      const customerId = Number(orderForm.customer);
      const productId = Number(orderForm.product);
      const qty = Number(orderForm.quantity);
      const draft: DraftOrder = {
        customerId,
        productId,
        productName: selectedProduct?.product_name || "",
        productUnitPrice: productPrice,
        quantity: qty,
        discount: orderDiscount,
        order_status: orderForm.order_status,
        order_req_date: orderForm.order_req_date ? new Date(orderForm.order_req_date).toISOString() : null,
        status: orderForm.status || null,
        notes: orderForm.notes || null,
        total_amount: subTotal,
        total_bill_after_discount: totalAfterDiscount,
      };
      setDraftOrder(draft);
      setActiveTab("billing");
      showModal("Order confirmed", "Order is saved in memory. Complete billing to save it to the database.");
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      showModal("Error", `Error placing order: ${errorMessage}`);
      console.error("Order placement error:", error);
    }
  };

  const updateExistingOrder = async () => {
    if (!editOrderId) return;
    if (!orderForm.customer || !orderForm.product || !orderForm.quantity) {
      showModal("Missing fields", "Please fill all required fields.");
      return;
    }
    if (Number(orderForm.quantity) <= 0) {
      showModal("Invalid quantity", "Quantity must be greater than 0.");
      return;
    }
    try {
      // Update order
      const orderPayload = {
        customer: Number(orderForm.customer),
        order_status: Number(orderForm.order_status) || 0,
        total_amount: subTotal,
        discount: orderDiscount,
        order_req_date: orderForm.order_req_date ? new Date(orderForm.order_req_date).toISOString() : null,
        total_item_quantity: Number(orderForm.quantity) || null,
        status: orderForm.status || null,
        notes: orderForm.notes || null,
      };
      const orderRes = await apiRequest(`/orders/${editOrderId}/`, {
        method: "PUT",
        body: JSON.stringify(orderPayload),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        showModal("Error", `Failed to update order.\n${JSON.stringify(err)}`);
        return;
      }

      // Update order detail (first row)
      if (editOrderDetailId) {
        const detailPayload = {
          order: editOrderId,
          product: Number(orderForm.product),
          order_item: selectedProduct?.product_name || "",
          quantity: Number(orderForm.quantity),
          price: productPrice,
          sub_total: subTotal,
          discount: orderDiscount,
        };
        const dRes = await apiRequest(`/order-details/${editOrderDetailId}/`, {
          method: "PUT",
          body: JSON.stringify(detailPayload),
        });
        if (!dRes.ok) {
          const err = await dRes.json().catch(() => ({}));
          showModal("Error", `Failed to update order details.\n${JSON.stringify(err)}`);
          return;
        }
      }

      // Update billing if present (or create one if user provided amount)
      const received = billing.amount_received ? Number(billing.amount_received) : 0;
      const billPayload = {
        order: editOrderId,
        customer: Number(orderForm.customer),
        total_bill: totalAfterDiscount,
        amount_received: received,
        balance: Math.max(totalAfterDiscount - received, 0),
        payment_method: billing.payment_method || "",
        status: billing.status || "",
        remarks: billing.remarks || "",
      };

      if (editBillingId) {
        const bRes = await apiRequest(`/billings/${editBillingId}/`, {
          method: "PUT",
          body: JSON.stringify(billPayload),
        });
        if (!bRes.ok) {
          const err = await bRes.json().catch(() => ({}));
          showModal("Error", `Failed to update billing.\n${JSON.stringify(err)}`);
          return;
        }
      } else if (billing.amount_received || billing.payment_method || billing.status || billing.remarks) {
        const bRes = await apiRequest(`/billings/`, {
          method: "POST",
          body: JSON.stringify(billPayload),
        });
        if (!bRes.ok) {
          const err = await bRes.json().catch(() => ({}));
          showModal("Error", `Failed to create billing.\n${JSON.stringify(err)}`);
          return;
        }
      }

      showModal("Success", "Order updated successfully.");
      // refresh local caches
      apiRequest('/orders/').then(r => r.json()).then(setOrders).catch(console.error);
      apiRequest('/billings/').then(r => r.json()).then(setBillings).catch(console.error);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("editOrderId");
        next.set("tab", "order");
        return next;
      });
    } catch (e: any) {
      showModal("Error", e?.message || String(e));
    }
  };

  /* ---------- BILLING ---------- */
  const generateBill = async () => {
    const received = Number(billing.amount_received);
    if (received < 0) {
      showModal("Invalid amount", "Amount received cannot be negative.");
      return;
    }

    try {
      // If we have a draft order, confirm it now by writing to DB (order -> order-details -> billing)
      if (draftOrder) {
        if (received > draftOrder.total_bill_after_discount) {
          showModal("Invalid amount", "Amount received cannot be greater than total bill.");
          return;
        }

        // 1) Create order
        const orderRes = await apiRequest("/orders/", {
          method: "POST",
          body: JSON.stringify({
            customer: draftOrder.customerId,
            order_status: draftOrder.order_status,
            total_amount: draftOrder.total_amount,
            discount: draftOrder.discount,
            total_bill_after_discount: draftOrder.total_bill_after_discount,
            order_req_date: draftOrder.order_req_date,
            total_item_quantity: draftOrder.quantity,
            status: draftOrder.status,
            notes: draftOrder.notes,
          }),
        });

        if (!orderRes.ok) {
          const err = await orderRes.json().catch(() => ({ detail: "Failed to create order" }));
          showModal("Error", err?.detail || "Failed to create order");
          return;
        }

        const createdOrder = await orderRes.json();
        const orderId = createdOrder.order_id || createdOrder.id;

        // 2) Create order details
        const orderDetailRes = await apiRequest("/order-details/", {
          method: "POST",
          body: JSON.stringify({
            order: orderId,
            product: draftOrder.productId,
            order_item: draftOrder.productName,
            quantity: draftOrder.quantity,
            price: draftOrder.productUnitPrice,
            discount: draftOrder.discount,
            sub_total: draftOrder.total_bill_after_discount,
          }),
        });

        if (!orderDetailRes.ok) {
          const err = await orderDetailRes.json().catch(() => ({ detail: "Failed to create order detail" }));
          // Best-effort cleanup: delete order if details failed
          try {
            await apiRequest(`/orders/${orderId}/`, { method: "DELETE" });
          } catch {
            // ignore cleanup errors
          }
          showModal("Error", err?.detail || "Failed to create order detail");
          return;
        }

        // 3) Create billing
        const billingData = {
          order: orderId,
          customer: draftOrder.customerId,
          total_bill: draftOrder.total_bill_after_discount,
          amount_received: received,
          balance: draftOrder.total_bill_after_discount - received,
          payment_method: billing.payment_method || null,
          status: billing.status || null,
          remarks: billing.remarks || "",
        };

        const result = await post("/billings/", billingData);
        if (result) {
          // Refresh lists
          refreshOrders();
          apiRequest("/billings/").then((r) => r.json()).then(setBillings).catch(console.error);
          apiRequest("/products/").then((r) => r.json()).then(setProducts).catch(console.error);

          await printReceipt(result);

          setDraftOrder(null);
          setBilling({
            order: "",
            amount_received: "",
            payment_method: "",
            status: "",
            remarks: "",
          });
          showModal("Order confirmed", "Order and billing saved successfully.");
        }
        return;
      }

      // Otherwise, behave as before: bill an existing order
      if (!selectedOrder) {
        showModal("Missing order", "Please select an order.");
        return;
      }

      if (received > selectedOrder.total_amount) {
        showModal("Invalid amount", "Amount received cannot be greater than total bill.");
        return;
      }

      const billingData = {
        order: selectedOrder.order_id,
        customer: selectedOrder.customer,
        total_bill: selectedOrder.total_amount,
        amount_received: received,
        balance: selectedOrder.total_amount - received,
        payment_method: billing.payment_method || null,
        status: billing.status || null,
        remarks: billing.remarks || "",
      };

      const result = await post("/billings/", billingData);
      if (result) {
        apiRequest("/billings/").then((r) => r.json()).then(setBillings).catch(console.error);
        await printReceipt(result);
        setBilling({
          order: "",
          amount_received: "",
          payment_method: "",
          status: "",
          remarks: "",
        });
        setLastPlacedOrderId(null);
      }
    } catch (error) {
      showModal("Error", `Error confirming order: ${String(error)}`);
    }
  };

  /* ---------- PRINT RECEIPT ---------- */
  const printReceipt = async (bill: Billing) => {
    const customer = customers.find(c => c.customer_id === bill.customer);
    let orderNo: string | null = null;
    try {
      const orderRes = await apiRequest(`/orders/${bill.order}/`);
      if (orderRes.ok) {
        const o = await orderRes.json();
        orderNo = o?.order_no ?? null;
      }
    } catch {
      // ignore
    }

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
          ${orderNo ? `
          <div class="info-row">
            <span class="label">Order No:</span>
            <span>${orderNo}</span>
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
      {!active && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Select an option from the left <span className="font-semibold">Operations</span> menu to open its form.
        </div>
      )}

      {/* ---------- VENDOR ---------- */}
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
      {active === "raw" && (
        <div className={card}>
          <input className={input} placeholder="Material" value={raw.material} onChange={e => setRaw({ ...raw, material: e.target.value })} />
          <input className={input} placeholder="Unit" value={raw.measuring_unit} onChange={e => setRaw({ ...raw, measuring_unit: e.target.value })} />
          <input className={input} placeholder="Quantity" type="number" value={raw.quantity} onChange={e => setRaw({ ...raw, quantity: e.target.value })} />
          <input className={input} placeholder="Price per Unit" type="number" value={raw.price} onChange={e => setRaw({ ...raw, price: e.target.value })} />
          <textarea className={input} placeholder="Description" value={raw.description} onChange={e => setRaw({ ...raw, description: e.target.value })} />
          <label className="block font-semibold mb-2">Vendor *</label>
          <select
            className={input}
            value={raw.vendor}
            onChange={e => setRaw({ ...raw, vendor: e.target.value })}
          >
            <option value="">Select Vendor</option>
            {vendors.map(v => (
              <option key={v.vendor_id} value={v.vendor_id}>
                {v.name} - {v.phone || 'No phone'}
              </option>
            ))}
          </select>
          <button className={primaryBtn} onClick={() => post('/raw-materials/', {
            ...raw,
            quantity: Number(raw.quantity) || 0,
            price: Number(raw.price) || 0,
            vendor: Number(raw.vendor) || 0,
          }).then(() => {
            setRaw({ material: "", measuring_unit: "", description: "", quantity: "", price: "", vendor: "" });
            apiRequest('/raw-materials/').then(r => r.json()).then(setRawMaterials).catch(console.error);
          })}>Save Raw Material</button>
        </div>
      )}

      {/* ---------- PRODUCT ---------- */}
      {active === "product" && (
        <div className={card}>
          <input className={input} placeholder="Product Name" value={product.product_name} onChange={e => setProduct({ ...product, product_name: e.target.value })} />
          <textarea className={input} placeholder="Description" value={product.description} onChange={e => setProduct({ ...product, description: e.target.value })} />
          <input className={input} placeholder="Price" type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} />
          <input className={input} placeholder="Quantity to Manufacture" type="number" value={product.quantity} onChange={e => setProduct({ ...product, quantity: e.target.value })} />
          
          <div className="mt-4">
            <label className="block font-semibold mb-2">Raw Materials Required (Bill of Materials)</label>
            {productRawMaterials.map((bom, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <select
                  className={input}
                  value={bom.raw_material}
                  onChange={e => {
                    const updated = [...productRawMaterials];
                    updated[index].raw_material = e.target.value;
                    setProductRawMaterials(updated);
                  }}
                >
                  <option value="">Select Raw Material</option>
                  {rawMaterials.map(rm => (
                    <option key={rm.material_id} value={rm.material_id}>
                      {rm.material} ({rm.measuring_unit})
                    </option>
                  ))}
                </select>
                <input
                  className={input}
                  type="number"
                  placeholder="Total Quantity to Use"
                  value={bom.quantity_required}
                  onChange={e => {
                    const updated = [...productRawMaterials];
                    updated[index].quantity_required = e.target.value;
                    setProductRawMaterials(updated);
                  }}
                />
                {productRawMaterials.length > 1 && (
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    onClick={() => {
                      const updated = productRawMaterials.filter((_, i) => i !== index);
                      setProductRawMaterials(updated);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 mt-2"
              onClick={() => setProductRawMaterials([...productRawMaterials, { raw_material: "", quantity_required: "" }])}
            >
              Add Raw Material
            </button>
          </div>

          <button className={primaryBtn} onClick={async () => {
            try {
              // First create the product
              const productData = {
                product_name: product.product_name,
                description: product.description,
                price: Number(product.price) || 0,
                quantity: Number(product.quantity) || 0,
              };
              
              const productRes = await apiRequest('/products/', {
                method: "POST",
                body: JSON.stringify(productData),
              });
              
              if (!productRes.ok) {
                const error = await productRes.json();
                showModal("Error", JSON.stringify(error));
                return;
              }
              
              const createdProduct = await productRes.json();
              const productId = createdProduct.product_id || createdProduct.id;
              
              // Then create BOM entries
              const validBOMs = productRawMaterials.filter(bom => bom.raw_material && bom.quantity_required);
              
              if (validBOMs.length > 0) {
                for (const bom of validBOMs) {
                  const bomRes = await apiRequest('/product-raw-materials/', {
                    method: "POST",
                    body: JSON.stringify({
                      product: productId,
                      raw_material: Number(bom.raw_material),
                      quantity_required: Number(bom.quantity_required),
                    }),
                  });
                  
                  if (!bomRes.ok) {
                    const error = await bomRes.json();
                    showModal("Error creating BOM entry", JSON.stringify(error));
                    return;
                  }
                }
              }
              
              // After all BOM entries are created, trigger deduction by updating product
              // Set quantity to 0 first, then to desired quantity to trigger deduction
              if (Number(product.quantity) > 0) {
                const currentQty = Number(product.quantity);
                
                // First set to 0
                await apiRequest(`/products/${productId}/`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    product_name: createdProduct.product_name,
                    description: createdProduct.description || "",
                    price: createdProduct.price,
                    quantity: 0,
                  }),
                });
                
                // Then set to desired quantity - this will trigger deduction in perform_update
                const updateRes = await apiRequest(`/products/${productId}/`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    product_name: createdProduct.product_name,
                    description: createdProduct.description || "",
                    price: createdProduct.price,
                    quantity: currentQty,
                  }),
                });
                
                if (!updateRes.ok) {
                  const error = await updateRes.json();
                  showModal(
                    "Warning",
                    `Product created but raw material deduction failed:\n${JSON.stringify(error)}`
                  );
                }
              }
              
              showModal("Success", "Product saved successfully!");
              setProduct({ product_name: "", description: "", price: "", quantity: "" });
              setProductRawMaterials([{ raw_material: "", quantity_required: "" }]);
              
              // Refresh products list
              apiRequest('/products/').then(r => r.json()).then(setProducts).catch(console.error);
            } catch (error: any) {
              showModal("Error", error?.message || String(error));
            }
          }}>Save Product</button>
        </div>
      )}

      {/* ---------- CUSTOMER ---------- */}
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
      {active === "order" && (
        <div className={card}>
          {isEditMode && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-3 text-sm text-[var(--muted-color)]">
              Editing order <span className="font-semibold text-[var(--heading-color)]">#{editOrderId}</span>. Update fields and click{" "}
              <span className="font-semibold text-[var(--heading-color)]">Update Order</span>.
            </div>
          )}
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
                {p.product_name} {p.price ? `- ${formatCurrency(p.price)}` : ""} {typeof p.quantity === "number" ? `(${p.quantity} available)` : ""}
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
          {isQtyInsufficient && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Low inventory. Available: <span className="font-semibold">{availableQty}</span>
            </div>
          )}

          <label className="block font-semibold mb-2 mt-4">Discount (PKR)</label>
          <input
            className={input}
            type="number"
            placeholder="Discount"
            min="0"
            value={orderForm.discount}
            onChange={e => setOrderForm({ ...orderForm, discount: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Required Date</label>
          <input
            className={input}
            type="datetime-local"
            value={orderForm.order_req_date}
            onChange={e => setOrderForm({ ...orderForm, order_req_date: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Status</label>
          <input
            className={input}
            type="text"
            placeholder="e.g., Pending, Delivered"
            value={orderForm.status}
            onChange={e => setOrderForm({ ...orderForm, status: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Notes</label>
          <textarea
            className={input}
            placeholder="Notes"
            value={orderForm.notes}
            onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
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

          {isEditMode && (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-4 mt-4 space-y-3">
              <div className="font-semibold text-[var(--heading-color)]">Billing</div>
              <label className="block font-semibold">Amount Received (PKR)</label>
              <input
                className={input}
                type="number"
                min="0"
                value={billing.amount_received}
                onChange={(e) => setBilling({ ...billing, amount_received: e.target.value })}
              />
              <label className="block font-semibold">Payment Method</label>
              <select
                className={input}
                value={billing.payment_method}
                onChange={(e) => setBilling({ ...billing, payment_method: e.target.value })}
              >
                <option value="">Select payment method</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
              <label className="block font-semibold">Billing Status</label>
              <select
                className={input}
                value={billing.status}
                onChange={(e) => setBilling({ ...billing, status: e.target.value })}
              >
                <option value="">Select status</option>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
              <label className="block font-semibold">Remarks</label>
              <textarea
                className={input}
                value={billing.remarks}
                onChange={(e) => setBilling({ ...billing, remarks: e.target.value })}
              />
            </div>
          )}

          {orderForm.product && orderForm.quantity && (
            <div className="bg-[rgba(14,165,164,0.10)] p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Subtotal:</span>
                <span className="font-bold text-xl text-[var(--accent-color)]">{formatCurrency(totalAfterDiscount)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {orderForm.quantity} × {formatCurrency(productPrice)} = {formatCurrency(subTotal)}
                {orderDiscount > 0 ? ` — Discount ${formatCurrency(orderDiscount)} = ${formatCurrency(totalAfterDiscount)}` : ""}
              </div>
            </div>
          )}

          <button 
            className={`${primaryBtn} w-full mt-4`} 
            onClick={isEditMode ? updateExistingOrder : confirmOrder}
            disabled={!orderForm.customer || !orderForm.product || !orderForm.quantity || isQtyInsufficient}
          >
            {isEditMode ? "Update Order" : "Confirm"}
          </button>
        </div>
      )}

      {/* ---------- BILLING ---------- */}
      {active === "billing" && (
        <div className={card}>
          {draftOrder ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-4 space-y-1">
              <div className="text-sm text-[var(--muted-color)]">Pending (not saved yet)</div>
              <div className="font-semibold text-[var(--heading-color)]">
                {draftOrder.productName} × {draftOrder.quantity}
              </div>
              <div className="text-sm text-[var(--muted-color)]">
                Total: {formatCurrency(draftOrder.total_bill_after_discount)}
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {!draftOrder && !selectedOrder && (
            <div className="mt-3 rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] p-4 text-sm text-[var(--muted-color)]">
              No pending order. Go to <span className="font-semibold text-[var(--heading-color)]">Orders</span> and click Confirm first, or select an existing order above.
            </div>
          )}

          {((selectedOrder && selectedCustomer) || draftOrder) && (
            <>
              {(() => {
                const totalBill = draftOrder
                  ? draftOrder.total_bill_after_discount
                  : (selectedOrder?.total_amount ?? 0);
                const received = Number(billing.amount_received || 0);
                const balance = totalBill - received;

                return (
                  <>
              <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Customer Name:</span>
                  <span>{draftOrder ? (customers.find(c => c.customer_id === draftOrder.customerId)?.name || "N/A") : selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Total Price:</span>
                  <span className="text-lg font-bold text-[var(--accent-color)]">{formatCurrency(draftOrder ? draftOrder.total_bill_after_discount : selectedOrder.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Date:</span>
                  <span>{orderDate}</span>
                </div>
                {!draftOrder && selectedOrder.order_no && (
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
                max={totalBill}
                value={billing.amount_received}
                onChange={e => setBilling({ ...billing, amount_received: e.target.value })} 
              />

              <label className="block font-semibold mb-2 mt-4">Payment Method</label>
              <select
                className={input}
                value={billing.payment_method}
                onChange={e => setBilling({ ...billing, payment_method: e.target.value })}
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Online">Online</option>
              </select>

              <label className="block font-semibold mb-2 mt-4">Status</label>
              <select
                className={input}
                value={billing.status}
                onChange={e => setBilling({ ...billing, status: e.target.value })}
              >
                <option value="">Select Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>

              <label className="block font-semibold mb-2 mt-4">Remarks</label>
              <textarea
                className={input}
                placeholder="Remarks"
                value={billing.remarks}
                onChange={e => setBilling({ ...billing, remarks: e.target.value })}
              />

              {billing.amount_received && (
                <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Balance:</span>
                    <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              )}
                  </>
                );
              })()}

              <button 
                className={`${primaryBtn} w-full mt-4`} 
                onClick={generateBill}
                disabled={!billing.amount_received || Number(billing.amount_received) < 0}
              >
                Confirm Order
              </button>
            </>
          )}

          {!selectedOrder && billing.order && (
            <div className="text-red-600 mt-2">Order not found</div>
          )}
        </div>
      )}

      {/* ---------- EXPENSE ---------- */}
      {active === "expense" && (
        <div className={card}>
          <label className="block font-semibold mb-2">Category Name *</label>
          <input
            className={input}
            type="text"
            placeholder="e.g., Diesel, Guest Tea, Electricity, etc."
            value={expense.category_name}
            onChange={e => setExpense({ ...expense, category_name: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Date *</label>
          <input
            className={input}
            type="date"
            value={expense.date}
            onChange={e => setExpense({ ...expense, date: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Amount *</label>
          <input
            className={input}
            type="number"
            placeholder="Amount"
            value={expense.amount}
            onChange={e => setExpense({ ...expense, amount: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Quantity (Optional)</label>
          <input
            className={input}
            type="number"
            placeholder="Quantity"
            value={expense.quantity}
            onChange={e => setExpense({ ...expense, quantity: e.target.value })}
          />

          <label className="block font-semibold mb-2 mt-4">Remarks</label>
          <textarea
            className={input}
            placeholder="Remarks"
            value={expense.remarks}
            onChange={e => setExpense({ ...expense, remarks: e.target.value })}
          />

          <button
            className={primaryBtn}
            onClick={() => post('/expenses/', {
              category_name: expense.category_name,
              date: expense.date,
              amount: Number(expense.amount) || 0,
              quantity: expense.quantity ? Number(expense.quantity) : null,
              remarks: expense.remarks,
            }).then(() => {
              setExpense({
                category_name: "",
                date: new Date().toISOString().split('T')[0],
                amount: "",
                quantity: "",
                remarks: "",
              });
            })}
            disabled={!expense.category_name || !expense.date || !expense.amount}
          >
            Save Expense
          </button>
        </div>
      )}
    </div>
  );
};

export default Operations;
