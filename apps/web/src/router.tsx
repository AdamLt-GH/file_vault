import { Navigate, createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { ProtectedRoute, SignedOutRoute } from "./features/auth/RouteGuards";
import { LoginPage } from "./pages/LoginPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: (
      <SignedOutRoute>
        <LoginPage />
      </SignedOutRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
