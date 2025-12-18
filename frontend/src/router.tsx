// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import Operations from "./pages/Operations";
import Management from "./pages/Managment";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <AppLayout />, // sidebar + topbar wrapper
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/operations", element:<Operations/>},
      { path: "/management", element:<Management/>},
      // { path: "/orders", element: <Orders /> }, etc.
    ],
  },
  { path: "*", element: <div className="p-6">404 — Not found</div> },
]);
