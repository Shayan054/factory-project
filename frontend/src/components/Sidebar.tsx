// src/components/Sidebar.tsx
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Props = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: Props) {
  const { isCEO } = useAuth();
  // collapsible groups (open by default like SB Admin 2)
  const [componentsOpen, setComponentsOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);

  // shared link styles
  const base =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40";
  const active = "bg-white/10 text-white shadow-inner";

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
          "fixed inset-y-0 left-0 z-50 w-64 transform text-white transition-transform duration-200 ease-out",
          // SB Admin 2 blue gradient
          "bg-linear-to-b from-[#4e73df] to-[#224abe]",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          "overflow-y-auto",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Brand */}
        <div className="px-4 py-4">
          <Link to="/" className="flex items-center gap-3 font-extrabold tracking-wide">
            <span className="inline-grid h-9 w-9 place-items-center rounded-full bg-white/20">🧱</span>
            <span className="uppercase">SB Admin 2</span>
          </Link>
        </div>

        <Divider />

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

        <Divider />

        {/* Factory Operations */}
        <SectionLabel>Factory Operations</SectionLabel>
        <nav className="px-3 space-y-1">
          <NavLink
            to="/operations"
            className={({ isActive }) => `${base} ${isActive ? active : ""}`}
            onClick={onClose}
          >
            <IconCog className="h-4 w-4" />
            <span>Operations</span>
          </NavLink>
          {isCEO && (
            <NavLink
              to="/management"
              className={({ isActive }) => `${base} ${isActive ? active : ""}`}
              onClick={onClose}
            >
              <IconTable className="h-4 w-4" />
              <span>Management</span>
            </NavLink>
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

        {/* Footer strip */}
        <div className="mt-6 bg-[#224abe] px-4 py-3 text-xs text-white/90">
          SB-style Tailwind Sidebar
        </div>
      </aside>
    </>
  );
}

/* Helpers */
function Divider() {
  return <div className="my-3 border-t border-white/10" />;
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/70">
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
