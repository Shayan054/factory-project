import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isGuest } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--background-color)] text-[var(--default-color)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="transition-all duration-200 lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        {isGuest && (
          <div
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 sm:px-6 lg:px-8"
            role="status"
          >
            <span className="font-bold">Demo / Guest Mode</span>
            {" — "}
            You are browsing sample data. Orders and changes stay in this browser only and are
            cleared when you exit or restart the demo.
          </div>
        )}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
