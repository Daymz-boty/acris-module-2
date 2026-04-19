// ============================================================================
// ProtectedRoute.jsx — ACRIS · Route Guard
// ============================================================================
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();

  // Don't redirect until we've checked localStorage
  if (!ready) return null;

  if (!isAuthenticated()) {
    // Preserve intended destination so login can redirect back
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}
