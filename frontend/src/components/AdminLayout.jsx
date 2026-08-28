// Visually distinct from AppLayout (tenant dashboard) on purpose —
// a dark header marks this as a different, higher-privilege area of
// the app, so it's never mistaken for a regular tenant screen.
import { useAuth } from '../context/AuthContext';

export default function AdminLayout({ children }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-white">Platform Admin</span>
          <button
            onClick={logout}
            className="text-sm text-gray-300 hover:text-white border border-gray-600 rounded-md px-3 py-1.5"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
