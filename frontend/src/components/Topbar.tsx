import * as React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Notification and message counts (wire to API later)
  const notifCount = 0;
  const msgCount = 0;

  const userName = user ? `${user.first_name} ${user.last_name}` : "User";
  const userRole = user?.role === "CEO" ? "CEO" : "Manager";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-color)] bg-[var(--surface-color)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Sidebar toggle (template-like) */}
        <button
          onClick={onMenuClick}
          className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--muted-color)] hover:text-[var(--accent-color)] transition lg:hidden"
          aria-label="Toggle sidebar"
          title="Toggle Sidebar"
        >
          <SidebarToggleIcon className="h-5 w-5" />
        </button>

        {/* Brand */}
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 transition hover:opacity-90"
        >
          <span className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(14,165,164,0.12)] ring-1 ring-[rgba(14,165,164,0.18)]">
            <img src={logo} alt="" className="h-8 w-8 object-contain" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-bold leading-tight tracking-tight text-[var(--heading-color)] sm:text-lg">
              Asghar Block Factory
            </div>
            <div className="hidden truncate text-sm font-medium text-[var(--muted-color)] sm:block">
              Factory Management System
            </div>
          </div>
        </Link>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
         

          {/* Profile */}
          <div
            className="relative ml-1"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setProfileOpen(false);
              }
            }}
          >
            <button
              className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] px-3 py-2 hover:border-[rgba(14,165,164,0.35)] transition"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(14,165,164,0.12)]">
                <UserIcon className="h-5 w-5 text-[var(--accent-color)]" />
              </div>
              <div className="hidden text-left md:block">
                <div className="text-base font-semibold leading-5 text-[var(--heading-color)]">{userName}</div>
                <div className="text-sm font-medium text-[var(--muted-color)]">{userRole}</div>
              </div>
              <ChevronDownIcon className="hidden h-5 w-5 text-[var(--muted-color)] md:block" />
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--surface-color)] shadow-lg"
                role="menu"
              >
                <div className="px-4 py-3">
                  <div className="text-base font-semibold text-[var(--heading-color)]">{userName}</div>
                  <div className="text-sm font-medium text-[var(--muted-color)]">{userRole}</div>
                </div>
                <div className="border-t border-[var(--border-color)]" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50"
                  role="menuitem"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  title,
  ariaLabel,
  badge,
}: {
  children: React.ReactNode;
  title: string;
  ariaLabel: string;
  badge: number;
}) {
  return (
    <button
      className="relative grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--muted-color)] hover:text-[var(--accent-color)] transition"
      title={title}
      aria-label={ariaLabel}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 grid min-h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--accent-color)] px-1 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

/* Icons (inherit currentColor) */
function SidebarToggleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm7 2H5v10h6V7zm2 0v10h6V7h-6z" />
    </svg>
  );
}
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.71.71l.27.28v.79l5 4.99L20.49 19l-4.99-5zM10 14a4 4 0 110-8 4 4 0 010 8z" />
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
function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 4h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-4 4V6a2 2 0 012-2zm4 5h8v2H8V9zm0 4h6v2H8v-2z" />
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
function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
    </svg>
  );
}
function LogoutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M10 17l1.41-1.41L9.83 14H20v-2H9.83l1.58-1.59L10 9l-5 5 5 3zm-6 4h8v-2H4V5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
