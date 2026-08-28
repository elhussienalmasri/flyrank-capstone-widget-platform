// Shared shell for authenticated pages: top nav with the tenant's
// name and a logout button, consistent page padding underneath.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout({ children, wide = false }) {
  const { tenant, logout } = useAuth();
  const maxWidth = wide ? 'max-w-5xl' : 'max-w-4xl';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className={`${maxWidth} mx-auto px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Widget Platform</span>
            <nav className="flex gap-4 text-sm">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link to="/widgets" className="text-gray-600 hover:text-gray-900">Widgets</Link>
              <Link to="/submissions" className="text-gray-600 hover:text-gray-900">Submissions</Link>
              <Link to="/visitors" className="text-gray-600 hover:text-gray-900">Visitors</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{tenant?.companyName}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md px-3 py-1.5"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className={`${maxWidth} mx-auto px-4 py-8`}>{children}</main>
    </div>
  );
}
