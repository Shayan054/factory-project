// src/router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import Operations from "./pages/Operations";
import Management from "./pages/Managment";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>, // sidebar + topbar wrapper
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/operations", element: <Operations /> },
      { path: "/management", element: <Management /> },
      { path: "/register", element: <RegisterPage /> },
      // { path: "/orders", element: <Orders /> }, etc.
    ],
  },
  { path: "*", element: <div className="p-6">404 — Not found</div> },
]);
