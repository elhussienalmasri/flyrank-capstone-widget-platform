// Gates admin-only pages using the SAME session as everywhere else
// — there is no separate admin login. Not authenticated at all ->
// send to /login. Authenticated but not an admin -> send to their
// own dashboard, not to a login screen (they're already logged in,
// just not allowed here).
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, loading, tenant } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (tenant?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}
