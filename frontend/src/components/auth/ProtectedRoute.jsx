import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Wraps a route element. Redirects unauthenticated users to /login and,
 * when officerOnly is set, redirects non-officers to the live map.
 */
function ProtectedRoute({ children, officerOnly = false }) {
  const { user, loading, isAuthenticated, isOfficer } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1220] text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (officerOnly && !isOfficer) {
    return <Navigate to="/map" replace />;
  }

  return children;
}

export default ProtectedRoute;