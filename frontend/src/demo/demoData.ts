/** Seeded demo entities for Guest/Demo Mode (frontend-only). */

export type DemoStore = {
  customers: any[];
  vendors: any[];
  products: any[];
  rawMaterials: any[];
  productRawMaterials: any[];
  orders: any[];
  orderDetails: any[];
  billings: any[];
  expenseCategories: any[];
  expenses: any[];
  nextIds: Record<string, number>;
};

const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

export const GUEST_USER = {
  employee_id: 0,
  email: "guest@demo.local",
  first_name: "Demo",
  last_name: "Guest",
  role: "MANAGER" as const,
  date_joined: nowIso(),
};

export function createSeedStore(): DemoStore {
  const expenseCategories = [
    { category_id: 1, name: "Utilities" },
    { category_id: 2, name: "Transport" },
    { category_id: 3, name: "Salaries" },
    { category_id: 4, name: "Maintenance" },
  ];

  const customers = [
    {
      customer_id: 1,
      name: "Ahmed Builders",
      contact: "03001234567",
      address: "Lahore Canal Road",
      remark: "Regular client",
      is_deleted: null,
    },
    {
      customer_id: 2,
      name: "City Developers",
      contact: "03219876543",
      address: "Islamabad G-11",
      remark: "",
      is_deleted: null,
    },
    {
      customer_id: 3,
      name: "Noor Construction",
      contact: "03335551212",
      address: "Faisalabad",
      remark: "Prefer morning delivery",
      is_deleted: null,
    },
  ];

  const vendors = [
    {
      vendor_id: 1,
      name: "Pak Cement Supply",
      contact_person: "Imran",
      email: "sales@pakcement.demo",
      phone: "04211122233",
    },
    {
      vendor_id: 2,
      name: "Sand & Crush Co.",
      contact_person: "Bilal",
      email: "",
      phone: "03001112233",
    },
  ];

  const rawMaterials = [
    {
      material_id: 1,
      material: "Cement",
      measuring_unit: "bag",
      description: "OPC cement",
      quantity: 420,
      price: 1350,
      vendor: 1,
    },
    {
      material_id: 2,
      material: "Sand",
      measuring_unit: "ton",
      description: "River sand",
      quantity: 85,
      price: 4500,
      vendor: 2,
    },
    {
      material_id: 3,
      material: "Crush",
      measuring_unit: "ton",
      description: "3/4 crush",
      quantity: 60,
      price: 5200,
      vendor: 2,
    },
  ];

  const products = [
    {
      product_id: 1,
      product_name: "Solid Block 6 inch",
      description: "Standard solid block",
      price: 45,
      quantity: 2500,
    },
    {
      product_id: 2,
      product_name: "Hollow Block 8 inch",
      description: "Hollow block for walls",
      price: 55,
      quantity: 1800,
    },
    {
      product_id: 3,
      product_name: "Kerbstone",
      description: "Road kerbstone",
      price: 120,
      quantity: 400,
    },
  ];

  const productRawMaterials = [
    { product_raw_material_id: 1, product: 1, raw_material: 1, quantity_required: 1 },
    { product_raw_material_id: 2, product: 1, raw_material: 2, quantity_required: 2 },
    { product_raw_material_id: 3, product: 2, raw_material: 1, quantity_required: 1 },
    { product_raw_material_id: 4, product: 2, raw_material: 3, quantity_required: 2 },
  ];

  const orders = [
    {
      order_id: 1,
      order_no: "ORD-DEMO-1001",
      order_date: nowIso(),
      order_status: 1,
      total_amount: 45000,
      discount: 0,
      total_bill_after_discount: 45000,
      customer: 1,
      order_req_date: today(),
      total_item_quantity: 1000,
      status: "Completed",
      notes: "Demo completed order",
      is_deleted: null,
    },
    {
      order_id: 2,
      order_no: "ORD-DEMO-1002",
      order_date: nowIso(),
      order_status: 0,
      total_amount: 27500,
      discount: 500,
      total_bill_after_discount: 27000,
      customer: 2,
      order_req_date: today(),
      total_item_quantity: 500,
      status: "Incomplete",
      notes: "Demo pending order",
      is_deleted: null,
    },
  ];

  const orderDetails = [
    {
      order_detail_id: 1,
      order: 1,
      product: 1,
      order_item: "Solid Block 6 inch",
      quantity: 1000,
      price: 45,
      discount: 0,
      sub_total: 45000,
    },
    {
      order_detail_id: 2,
      order: 2,
      product: 2,
      order_item: "Hollow Block 8 inch",
      quantity: 500,
      price: 55,
      discount: 500,
      sub_total: 27000,
    },
  ];

  const billings = [
    {
      billing_id: 1,
      order: 1,
      customer: 1,
      total_bill: 45000,
      amount_received: 45000,
      balance: 0,
      bill_date: nowIso(),
      payment_method: "Cash",
      status: "Paid",
      remarks: "Demo payment",
    },
    {
      billing_id: 2,
      order: 2,
      customer: 2,
      total_bill: 27000,
      amount_received: 10000,
      balance: 17000,
      bill_date: nowIso(),
      payment_method: "Bank",
      status: "Partial",
      remarks: "Partial demo payment",
    },
  ];

  const expenses = [
    {
      expense_id: 1,
      category: 1,
      date: today(),
      amount: 18000,
      quantity: null,
      remarks: "Electricity bill (demo)",
    },
    {
      expense_id: 2,
      category: 2,
      date: today(),
      amount: 7500,
      quantity: null,
      remarks: "Delivery fuel (demo)",
    },
    {
      expense_id: 3,
      category: 3,
      date: today(),
      amount: 120000,
      quantity: null,
      remarks: "Staff salaries (demo)",
    },
  ];

  return {
    customers,
    vendors,
    products,
    rawMaterials,
    productRawMaterials,
    orders,
    orderDetails,
    billings,
    expenseCategories,
    expenses,
    nextIds: {
      customers: 4,
      vendors: 3,
      products: 4,
      rawMaterials: 4,
      productRawMaterials: 5,
      orders: 3,
      orderDetails: 3,
      billings: 3,
      expenseCategories: 5,
      expenses: 4,
    },
  };
}
