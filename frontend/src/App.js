// ============================================================================
// App.js — ACRIS · Root Router
// ============================================================================
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage            from "./pages/LandingPage";
import LoginPage              from "./pages/LoginPage";
import WildfireDashboard      from "./pages/Wildfire";
import DesertificationDashboard from "./pages/DesertificationDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/"      element={<LandingPage />} />
          <Route path="/login" element={<LoginPage   />} />

          {/* Protected — requires valid JWT */}
          <Route path="/wildfire" element={
            <ProtectedRoute><WildfireDashboard /></ProtectedRoute>
          } />
          <Route path="/desertification" element={
            <ProtectedRoute><DesertificationDashboard /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
