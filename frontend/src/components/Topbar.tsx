// src/components/Topbar.tsx
import * as React from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  const { user, logout } = useAuth();
  
  // Notification and message counts (can be fetched from API later)
  const notifCount = 0;
  const msgCount = 0;
  
  // Safely get user info
  const userName = user ? `${user.first_name} ${user.last_name}` : "User";
  const userRole = user?.role === "CEO" ? "CEO" : "Manager";
  
  return (
    <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile: menu button */}
        <button
          onClick={onMenuClick}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm lg:hidden"
          aria-label="Open sidebar menu"
        >
          <HamburgerIcon className="h-4 w-4" />
          Menu
        </button>

        {/* Search (hidden on small screens) */}
        <form
          className="mx-4 hidden flex-1 items-center justify-center md:flex"
          role="search"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex w-full max-w-2xl overflow-hidden rounded-full border border-gray-300">
            <input
              aria-label="Search"
              placeholder="Search for..."
              className="w-full px-4 py-2 outline-none"
            />
            <button
              type="submit"
              className="grid place-items-center px-4"
              aria-label="Search"
              style={{ backgroundColor: "#4e73df", color: "white" }}
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          </div>
        </form>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-4">
          {/* Notifications */}
          <button
            className="relative grid h-9 w-9 place-items-center rounded-full border border-gray-300"
            aria-label="Open notifications"
          >
            <BellIcon className="h-4 w-4" />
            {notifCount > 0 && (
              <Badge>{notifCount > 9 ? "9+" : `${notifCount}+`}</Badge>
            )}
          </button>

          {/* Messages */}
          <button
            className="relative grid h-9 w-9 place-items-center rounded-full border border-gray-300"
            aria-label="Open messages"
          >
            <MailIcon className="h-4 w-4" />
            {msgCount > 0 && <Badge>{msgCount > 9 ? "9+" : `${msgCount}`}</Badge>}
          </button>

          {/* Divider */}
          <div className="mx-1 hidden h-6 w-px bg-gray-200 md:block" />

          {/* User */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <span className="block text-sm font-medium text-gray-700">{userName}</span>
              <span className="block text-xs text-gray-500">{userRole}</span>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100">
              <UserIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <button
              onClick={logout}
              className="ml-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Small helpers ---------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-semibold text-white"
      style={{ backgroundColor: "#e74a3b" }} // SB Admin 2 danger red
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

/* Icons (inherit currentColor) */
function HamburgerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
    </svg>
  );
}
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.71.71l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.505 4.505 0 019.5 14z" />
    </svg>
  );
}
function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 22a2 2 0 002-2H10a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
    </svg>
  );
}
