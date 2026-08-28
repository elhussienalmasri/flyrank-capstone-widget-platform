// Shows every submission a visitor sent in from ANY customer
// website that embeds one of this tenant's widgets — this is the
// actual "data flowing back" moment from the backend.
// Optional ?widgetId= filter (linked from the widgets list) narrows
// to submissions for one widget only. Aggregate stats live on
// /dashboard only — not duplicated here.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listWidgets } from '../api/widgetsApi';
import { listSubmissions, deleteSubmission } from '../api/dashboardApi';
import AppLayout from '../components/AppLayout';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SubmissionsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const widgetIdFilter = searchParams.get('widgetId') || '';

  const [submissions, setSubmissions] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [submissionsData, widgetsData] = await Promise.all([
          listSubmissions(token, { widgetId: widgetIdFilter || undefined }),
          listWidgets(token),
        ]);
        if (cancelled) return;
        setSubmissions(submissionsData);
        // signup/login widgets never produce submission rows (they go
        // through a separate account-creation flow) — excluding them
        // here means the filter dropdown only ever offers widgets that
        // could actually have results.
        setWidgets(widgetsData.filter((w) => w.type !== 'signup' && w.type !== 'login'));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, widgetIdFilter]);

  const widgetTitleById = Object.fromEntries(widgets.map((w) => [w.id, w.title]));

  function handleFilterChange(e) {
    const value = e.target.value;
    if (value) setSearchParams({ widgetId: value });
    else setSearchParams({});
  }

  async function handleDelete(id) {
    if (!confirm('The data will be removed permanently. Delete this submission?')) return;
    try {
      await deleteSubmission(token, id);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout wide>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Submissions</h1>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between mb-4">
        <select
          value={widgetIdFilter}
          onChange={handleFilterChange}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">All widgets</option>
          {widgets.map((w) => (
            <option key={w.id} value={w.id}>{w.title}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{submissions.length} result{submissions.length === 1 ? '' : 's'}</span>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading submissions…</p>}

      {!loading && submissions.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">
            No submissions yet. Once a visitor fills out the form on a site where the widget
            is embedded, it'll show up here.
          </p>
        </div>
      )}

      {submissions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Widget</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Submitted data</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Location</th>
                <th className="text-left font-medium text-gray-500 px-4 py-2">Received</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-700">
                    <Link to={`/widgets`} className="hover:underline">
                      {widgetTitleById[sub.widgetId] || '(deleted widget)'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {Object.entries(sub.fields).map(([key, value]) => (
                      <div key={key}><span className="text-gray-400">{key}:</span> {value}</div>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {sub.geo ? `${sub.geo.city ? sub.geo.city + ', ' : ''}${sub.geo.country}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(sub.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub.id)}
                      aria-label="Delete submission"
                      title="Delete submission"
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
