import { useState } from "react";

const Operations = () => {
  return (
    <div className="p-6 space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Operations</h1>
        <p className="text-gray-600 mt-1">
          Manage raw materials, products, customers, orders, and billing
        </p>
      </div>

      {/* Raw Material Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Add Raw Material</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Material Name</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Measuring Unit</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex items-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
              Add Raw Material
            </button>
          </div>
        </form>
      </div>

      {/* Product Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Create Product</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Product Name</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>

          <div className="flex items-end">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg">
              Add Product
            </button>
          </div>
        </form>
      </div>

      {/* Customer Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Add Customer</h2>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={3} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Remark</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={2} />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg">
              Add Customer
            </button>
          </div>
        </form>
      </div>

      {/* Place Order Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Place Order</h2>

        <form className="space-y-4">

          {/* Order (Header) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer ID</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order Date</label>
              <input type="date" className="w-full border rounded-lg px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select className="w-full border rounded-lg px-3 py-2">
                <option value="0">Pending</option>
                <option value="1">Completed</option>
              </select>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product ID</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Subtotal</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg">
              Place Order
            </button>
          </div>
        </form>
      </div>

      {/* Billing Section */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Billing</h2>

        <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order ID</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Bill</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount Received</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Balance</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bill Date</label>
            <input type="date" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex items-end">
            <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg">
              Generate Bill
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Operations;