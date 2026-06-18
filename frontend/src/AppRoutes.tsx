// src/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Operations from "./pages/Operations";
import Management from "./pages/Managment";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import { DashboardDataProvider } from "./context/DashboardDataContext";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardDataProvider>
              <AppLayout />
            </DashboardDataProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/operations" element={<Operations />} />
        <Route path="/management" element={<Management />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<div className="p-6">404 — Not found</div>} />
    </Routes>
  );
}

