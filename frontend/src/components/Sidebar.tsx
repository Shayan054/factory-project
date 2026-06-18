// src/components/Sidebar.tsx
import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: Props) {
  const { isCEO } = useAuth();
  const location = useLocation();
  // collapsible groups (open by default like SB Admin 2)
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [salesOrdersOpen, setSalesOrdersOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(false);
  const [managementCustomersOpen, setManagementCustomersOpen] = useState(false);
  const [managementVendorsOpen, setManagementVendorsOpen] = useState(false);
  const [managementProductsOpen, setManagementProductsOpen] = useState(false);
  const [managementRawMaterialsOpen, setManagementRawMaterialsOpen] = useState(false);

  // shared link styles (FlexAdmin-like)
  const base =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[var(--sidebar-color)] transition-colors hover:bg-[rgba(14,165,164,0.10)] focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.25)]";
  const active = "bg-[var(--accent-color)] text-[var(--sidebar-active-color)]";
  const subBase =
    "ml-7 flex items-center gap-3 rounded-lg bg-[rgba(14,165,164,0.03)] px-3 py-2 text-sm font-medium text-[var(--sidebar-color)] transition-colors hover:bg-[var(--accent-color)] hover:text-white focus:outline-none focus:ring-2 focus:ring-[rgba(14,165,164,0.25)]";

  const currentSearch = new URLSearchParams(location.search);
  const currentTab = currentSearch.get("tab");
  const isTabActive = (pathname: string, tab: string) =>
    location.pathname === pathname && currentTab === tab;

  const isSalesOrdersGroupActive =
    isTabActive("/operations", "order") || isTabActive("/management", "orders");

  const isCustomersGroupActive =
    isTabActive("/operations", "customer") || isTabActive("/management", "customers");

  const isVendorsGroupActive =
    isTabActive("/operations", "vendor") || isTabActive("/management", "vendors");

  const isProductsGroupActive =
    isTabActive("/operations", "product") || isTabActive("/management", "products");

  const isRawMaterialsGroupActive =
    isTabActive("/operations", "raw") || isTabActive("/management", "raw-materials");

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer / Static sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-out",
          "bg-[var(--sidebar-bg)] text-[var(--sidebar-color)] border-r border-[var(--sidebar-border)] shadow-lg ring-1 ring-black/5",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          "overflow-y-auto",
          "sidebar-scroll",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Brand */}
        <div className="flex h-16 items-center px-4">
          <Link to="/" className="flex min-w-0 items-center gap-3 font-extrabold tracking-wide">
            <span className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[rgba(14,165,164,0.12)] text-[var(--accent-color)]">
              <IconBlocks className="h-5 w-5" />
            </span>
            <span className="truncate uppercase text-[13px] font-extrabold tracking-wide text-[var(--heading-color)]">
              Asghar Block Factory
            </span>
          </Link>
        </div>

        <Divider className="" />

        {/* Dashboard section */}
        <SectionLabel>Dashboard</SectionLabel>
        <nav className="px-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${base} ${isActive ? active : ""}`}
            onClick={onClose}
          >
            <IconHome className="h-4 w-4" />
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <Divider className="my-3" />

        {/* Factory Operations */}
        <SectionLabel>Factory Operations</SectionLabel>
        <nav className="px-3 space-y-1">
          <button
            type="button"
            className={base}
            onClick={() => setOperationsOpen((v) => !v)}
            aria-expanded={operationsOpen}
          >
            <IconCog className="h-4 w-4" />
            <span className="flex-1 text-left">Operations</span>
            <IconChevron className={`h-4 w-4 transition-transform ${operationsOpen ? "rotate-180" : ""}`} />
          </button>

          {operationsOpen && (
            <div className="space-y-1">
              <NavLink
                to="/operations?tab=expense"
                className={() => `${subBase} ${isTabActive("/operations", "expense") ? active : ""}`}
                onClick={onClose}
              >
                <IconExpense className="h-4 w-4 opacity-90" />
                <span>Add Expense</span>
              </NavLink>
            </div>
          )}

          <button
            type="button"
            className={base}
            onClick={() => setSalesOpen((v) => !v)}
            aria-expanded={salesOpen}
          >
            <IconChart className="h-4 w-4" />
            <span className="flex-1 text-left">Sales</span>
            <IconChevron className={`h-4 w-4 transition-transform ${salesOpen ? "rotate-180" : ""}`} />
          </button>

          {salesOpen && (
            <div className="space-y-1">
              <button
                type="button"
                className={`${subBase} ${isSalesOrdersGroupActive ? active : ""}`}
                onClick={() => setSalesOrdersOpen((v) => !v)}
                aria-expanded={salesOrdersOpen}
              >
                <IconOrders className="h-4 w-4 opacity-90" />
                <span className="flex-1 text-left">Order</span>
                <IconChevron className={`h-4 w-4 transition-transform ${salesOrdersOpen ? "rotate-180" : ""}`} />
              </button>

              {salesOrdersOpen && (
                <div className="space-y-1">
                  <NavLink
                    to="/operations?tab=order"
                    className={() => `${subBase} ml-12 ${isTabActive("/operations", "order") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconOrders className="h-4 w-4 opacity-90" />
                    <span>New Order</span>
                  </NavLink>
                  <NavLink
                    to="/management?tab=orders"
                    className={() => `${subBase} ml-12 ${isTabActive("/management", "orders") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconTable className="h-4 w-4 opacity-90" />
                    <span>View Orders</span>
                  </NavLink>
                </div>
              )}

              <NavLink
                to="/operations?tab=billing"
                className={() => `${subBase} ${isTabActive("/operations", "billing") ? active : ""}`}
                onClick={onClose}
              >
                <IconBilling className="h-4 w-4 opacity-90" />
                <span>Billing</span>
              </NavLink>
            </div>
          )}
          <button
            type="button"
            className={base}
            onClick={() => setManagementOpen((v) => !v)}
            aria-expanded={managementOpen}
          >
            <IconTable className="h-4 w-4" />
            <span className="flex-1 text-left">Management</span>
            <IconChevron className={`h-4 w-4 transition-transform ${managementOpen ? "rotate-180" : ""}`} />
          </button>

          {managementOpen && (
            <div className="space-y-1">
              <button
                type="button"
                className={`${subBase} ${isCustomersGroupActive ? active : ""}`}
                onClick={() => setManagementCustomersOpen((v) => !v)}
                aria-expanded={managementCustomersOpen}
              >
                <IconCustomer className="h-4 w-4 opacity-90" />
                <span className="flex-1 text-left">Customers</span>
                <IconChevron className={`h-4 w-4 transition-transform ${managementCustomersOpen ? "rotate-180" : ""}`} />
              </button>

              {managementCustomersOpen && (
                <div className="space-y-1">
                  <NavLink
                    to="/management?tab=customers"
                    className={() => `${subBase} ml-12 ${isTabActive("/management", "customers") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconTable className="h-4 w-4 opacity-90" />
                    <span>View Customers</span>
                  </NavLink>
                  <NavLink
                    to="/operations?tab=customer"
                    className={() => `${subBase} ml-12 ${isTabActive("/operations", "customer") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconCustomer className="h-4 w-4 opacity-90" />
                    <span>Add Customer</span>
                  </NavLink>
                </div>
              )}

              <button
                type="button"
                className={`${subBase} ${isVendorsGroupActive ? active : ""}`}
                onClick={() => setManagementVendorsOpen((v) => !v)}
                aria-expanded={managementVendorsOpen}
              >
                <IconVendor className="h-4 w-4 opacity-90" />
                <span className="flex-1 text-left">Vendors</span>
                <IconChevron className={`h-4 w-4 transition-transform ${managementVendorsOpen ? "rotate-180" : ""}`} />
              </button>

              {managementVendorsOpen && (
                <div className="space-y-1">
                  <NavLink
                    to="/management?tab=vendors"
                    className={() => `${subBase} ml-12 ${isTabActive("/management", "vendors") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconTable className="h-4 w-4 opacity-90" />
                    <span>View Vendors</span>
                  </NavLink>
                  <NavLink
                    to="/operations?tab=vendor"
                    className={() => `${subBase} ml-12 ${isTabActive("/operations", "vendor") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconVendor className="h-4 w-4 opacity-90" />
                    <span>Add Vendor</span>
                  </NavLink>
                </div>
              )}

              <button
                type="button"
                className={`${subBase} ${isProductsGroupActive ? active : ""}`}
                onClick={() => setManagementProductsOpen((v) => !v)}
                aria-expanded={managementProductsOpen}
              >
                <IconProduct className="h-4 w-4 opacity-90" />
                <span className="flex-1 text-left">Products</span>
                <IconChevron className={`h-4 w-4 transition-transform ${managementProductsOpen ? "rotate-180" : ""}`} />
              </button>

              {managementProductsOpen && (
                <div className="space-y-1">
                  <NavLink
                    to="/management?tab=products"
                    className={() => `${subBase} ml-12 ${isTabActive("/management", "products") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconTable className="h-4 w-4 opacity-90" />
                    <span>View Products</span>
                  </NavLink>
                  <NavLink
                    to="/operations?tab=product"
                    className={() => `${subBase} ml-12 ${isTabActive("/operations", "product") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconProduct className="h-4 w-4 opacity-90" />
                    <span>Add Product</span>
                  </NavLink>
                </div>
              )}

              <button
                type="button"
                className={`${subBase} ${isRawMaterialsGroupActive ? active : ""}`}
                onClick={() => setManagementRawMaterialsOpen((v) => !v)}
                aria-expanded={managementRawMaterialsOpen}
              >
                <IconRaw className="h-4 w-4 opacity-90" />
                <span className="flex-1 text-left">Raw Materials</span>
                <IconChevron className={`h-4 w-4 transition-transform ${managementRawMaterialsOpen ? "rotate-180" : ""}`} />
              </button>

              {managementRawMaterialsOpen && (
                <div className="space-y-1">
                  <NavLink
                    to="/management?tab=raw-materials"
                    className={() => `${subBase} ml-12 ${isTabActive("/management", "raw-materials") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconTable className="h-4 w-4 opacity-90" />
                    <span>View Raw Materials</span>
                  </NavLink>
                  <NavLink
                    to="/operations?tab=raw"
                    className={() => `${subBase} ml-12 ${isTabActive("/operations", "raw") ? active : ""}`}
                    onClick={onClose}
                  >
                    <IconRaw className="h-4 w-4 opacity-90" />
                    <span>Add Raw Material</span>
                  </NavLink>
                </div>
              )}
            </div>
          )}
          {isCEO && (
            <NavLink
              to="/register"
              className={({ isActive }) => `${base} ${isActive ? active : ""}`}
              onClick={onClose}
            >
              <IconFolder className="h-4 w-4" />
              <span>Register Employee</span>
            </NavLink>
          )}
        </nav>

        {/* Footer strip removed */}
      </aside>
    </>
  );
}

/* Helpers */
function Divider({ className = "my-3" }: { className?: string }) {
  return <div className={`${className} border-t border-[var(--border-color)]`} />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--sidebar-muted-color)]">
      {children}
    </div>
  );
}

/* Minimal inline icons (inherit currentColor) */
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 3l9 8h-3v9H6v-9H3l9-8z"/></svg>);
}
function IconCog(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.7 4a7.8 7.8 0 00-.25-2l2-1.6-2-3.4-2.4.5a8 8 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a8 8 0 00-1.7 1l-2.4-.5-2 3.4 2 1.6a7.8 7.8 0 000 4l-2 1.6 2 3.4 2.4-.5a8 8 0 001.7 1l.4 2.5h4l.4-2.5a8 8 0 001.7-1l2.4.5 2-3.4-2-1.6c.17-.65.26-1.32.26-2z"/></svg>);
}
function IconWrench(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M22 19l-6.3-6.3a6 6 0 01-7.9-7.9L11 7l3-3 2.2 3.2A6 6 0 0119.7 14L23 17l-1 2zM2 22l6-6 2 2-6 6H2v-2z"/></svg>);
}
function IconChevron(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>);
}
function IconFolder(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M10 4l2 2h8v14H4V4h6z"/></svg>);
}
function IconChart(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 3h2v18H3V3zm4 8h2v10H7V11zm4-4h2v14h-2V7zm4 6h2v8h-2v-8zm4-10h2v18h-2V3z"/></svg>);
}
function IconTable(props: React.SVGProps<SVGSVGElement>) {
  return (<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M3 5h18v14H3V5zm2 2v3h14V7H5zm0 5v5h6v-5H5zm8 0v5h6v-5h-6z"/></svg>);
}

function IconBlocks(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l9 5v10l-9 5-9-5V7l9-5zm0 2.2L5 7l7 3.9L19 7l-7-2.8zM5 9.2v6.6l6 3.3v-6.6L5 9.2zm8 9.9l6-3.3V9.2l-6 3.3v6.6z" />
    </svg>
  );
}

function IconVendor(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 7l9-4 9 4v2H3V7zm2 4h14v9a2 2 0 01-2 2H7a2 2 0 01-2-2v-9zm3 2v7h2v-7H8zm6 0v7h2v-7h-2z" />
    </svg>
  );
}
function IconRaw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5zm-7 9l7 4 7-4v8l-7 4-7-4v-8z" />
    </svg>
  );
}
function IconProduct(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l8 4.5v11L12 22l-8-4.5v-11L12 2zm0 2.2L6 7l6 3.3L18 7l-6-2.8zM6 9.2v7.1l5 2.8v-7.1L6 9.2zm7 9.9l5-2.8V9.2l-5 2.8v7.1z" />
    </svg>
  );
}
function IconCustomer(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16 11c1.66 0 3-1.79 3-4s-1.34-4-3-4-3 1.79-3 4 1.34 4 3 4zM8 11c1.66 0 3-1.79 3-4S9.66 3 8 3 5 4.79 5 7s1.34 4 3 4zm0 2c-2.67 0-8 1.34-8 4v3h10v-3c0-1.54.84-2.78 2.13-3.7C10.6 13.1 9.04 13 8 13zm8 0c-.99 0-2.45.13-4 0 1.38.96 2 2.2 2 3.7v3h10v-3c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}
function IconBilling(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2zm3 5h6v2H9V7zm0 4h6v2H9v-2zm0 4h4v2H9v-2z" />
    </svg>
  );
}
function IconExpense(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 17h-2v-2h2v2zm1.07-7.75l-.9.92A1.5 1.5 0 0013 13.5V15h-2v-2a3 3 0 01.88-2.12l1.24-1.26A1.5 1.5 0 1010.5 8H8a4 4 0 118.07 3.25z" />
    </svg>
  );
}

function IconOrders(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 4h14v2H7V4zM3 3h2v3H3V3zm4 6h14v2H7V9zM3 8h2v3H3V8zm4 6h14v2H7v-2zM3 13h2v3H3v-3zm4 6h14v2H7v-2zM3 18h2v3H3v-3z" />
    </svg>
  );
}
