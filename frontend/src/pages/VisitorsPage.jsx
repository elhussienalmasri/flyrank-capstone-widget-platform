// Registered accounts created via `signup` widgets. Deliberately
// does NOT show logins — logging in only verifies against an
// existing account here, it never creates a new row, so there's
// nothing distinct to list for it. `login` widgets never appear in
// the filter dropdown below, for the same reason.
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listVisitors, deleteVisitor } from '../api/dashboardApi';
import { listWidgets } from '../api/widgetsApi';
import AppLayout from '../components/AppLayout';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function VisitorsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const widgetIdFilter = searchParams.get('widgetId') || '';

  const [visitors, setVisitors] = useState([]);
  const [signupWidgets, setSignupWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [visitorsData, widgetsData] = await Promise.all([
          listVisitors(token, { widgetId: widgetIdFilter || undefined }),
          listWidgets(token),
        ]);
        if (cancelled) return;
        setVisitors(visitorsData);
        // Only `signup` widgets are relevant here — a `login` widget
        // never originates a visitor, so it never belongs in this filter.
        setSignupWidgets(widgetsData.filter((w) => w.type === 'signup'));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, widgetIdFilter]);

  const widgetTitleById = useMemo(
    () => Object.fromEntries(signupWidgets.map((w) => [w.id, w.title])),
    [signupWidgets]
  );

  function handleFilterChange(e) {
    const value = e.target.value;
    if (value) setSearchParams({ widgetId: value });
    else setSearchParams({});
  }

  async function handleDelete(visitor) {
    const confirmed = confirm(
      `Remove ${visitor.name || visitor.email}? The data will be removed permanently.`
    );
    if (!confirmed) return;

    try {
      await deleteVisitor(token, visitor.id);
      setVisitors((prev) => prev.filter((v) => v.id !== visitor.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout wide>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Registered visitors</h1>
        <span className="text-sm text-gray-500">{visitors.length} account{visitors.length === 1 ? '' : 's'}</span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Only shown when there's more than one signup widget to choose between —
          with zero or one, a dropdown would have nothing meaningful to filter. */}
      {signupWidgets.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-gray-600">Widget:</label>
          <select
            value={widgetIdFilter}
            onChange={handleFilterChange}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All signup widgets</option>
            {signupWidgets.map((w) => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading…</p>}

      {!loading && visitors.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">
            No one has signed up yet. Once a visitor creates an account through one of your
            signup widgets, they'll show up here.
          </p>
        </div>
      )}

      {visitors.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Name</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Email</th>
                {signupWidgets.length > 1 && (
                  <th className="text-left font-medium text-gray-500 px-4 py-2">Widget</th>
                )}
                <th className="text-left font-medium text-gray-500 px-4 py-2">Signed up</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((visitor) => (
                <tr key={visitor.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-700">{visitor.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{visitor.email}</td>
                  {signupWidgets.length > 1 && (
                    <td className="px-4 py-3 text-gray-500">
                      {widgetTitleById[visitor.widgetId] || '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(visitor.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(visitor)}
                      aria-label="Remove visitor"
                      title="Remove visitor"
                      className="text-gray-400 hover:text-red-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
