import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import SectionPage, { DashboardHome } from "./pages/projects/SectionPage";
import { getCurrentUser } from "./services/authService";

function ProtectedRoute({ children }) {
  return getCurrentUser() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* /dashboard goes to the landing page chosen in Settings (default: overview) */}
          <Route index element={<DashboardHome />} />

          {/* Handles single-tab sections like /dashboard/overview */}
          <Route path=":section" element={<SectionPage />} />

          {/* Handles sections with sub-tabs like /dashboard/components/list */}
          <Route path=":section/:view" element={<SectionPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}