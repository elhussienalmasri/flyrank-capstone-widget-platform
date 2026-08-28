// Lists only the logged-in tenant's widgets (server already
// enforces isolation; this just renders what it returns), each with
// its generated embed snippet and edit/delete actions. Sortable by
// creation date (server order, default) or grouped by widget type.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listWidgets, deleteWidget } from '../api/widgetsApi';
import EmbedSnippet from '../components/EmbedSnippet';
import AppLayout from '../components/AppLayout';

const TYPE_LABELS = {
  subscribe: 'Subscribe',
  signup: 'Sign up',
  login: 'Log in',
  cta: 'Call to action',
  popover: 'Popover',
};

const TYPE_ORDER = ['subscribe', 'signup', 'login', 'cta', 'popover'];

function WidgetCard({ widget, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{widget.title}</h3>
          {widget.description && <p className="text-sm text-gray-500 mt-0.5">{widget.description}</p>}
          <span className="inline-block mt-2 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">
            {TYPE_LABELS[widget.type] || widget.type}
          </span>

          {widget.formFields && widget.formFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {widget.formFields.map((f) => (
                <span
                  key={f.name}
                  className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5"
                  title={f.type}
                >
                  {f.label || f.name}{f.required ? ' *' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 text-sm shrink-0">
          {widget.type === 'signup' && (
            <Link to={`/visitors?widgetId=${widget.id}`} className="text-indigo-600 hover:underline">Visitors</Link>
          )}
          {widget.type !== 'signup' && widget.type !== 'login' && (
            <Link to={`/submissions?widgetId=${widget.id}`} className="text-indigo-600 hover:underline">Submissions</Link>
          )}
          {/* login widgets never originate submissions or visitors of
              their own — they only authenticate accounts a signup
              widget already created — so there's nothing to link to here. */}
          <Link to={`/widgets/${widget.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
          <button onClick={() => onDelete(widget.id)} className="text-red-600 hover:underline">Delete</button>
        </div>
      </div>

      <div className="mt-4">
        <EmbedSnippet snippet={widget.embedSnippet} />
      </div>
    </div>
  );
}

export default function WidgetsListPage() {
  const { token } = useAuth();
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'type'

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await listWidgets(token); // server already returns newest-first
        if (!cancelled) setWidgets(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  async function handleDelete(id) {
    if (!confirm('Delete this widget? This cannot be undone.')) return;
    try {
      await deleteWidget(token, id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  // Grouped by type (in a fixed, sensible order) so a cta widget
  // never sits sandwiched between two unrelated signup widgets —
  // each type gets its own section instead of one interleaved list.
  const groupedByType = useMemo(() => {
    if (sortBy !== 'type') return null;
    const groups = {};
    for (const widget of widgets) {
      if (!groups[widget.type]) groups[widget.type] = [];
      groups[widget.type].push(widget);
    }
    return TYPE_ORDER.filter((t) => groups[t]?.length).map((type) => ({ type, items: groups[type] }));
  }, [widgets, sortBy]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Your widgets</h1>
        <Link
          to="/widgets/new"
          className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 transition"
        >
          + Create widget
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {widgets.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm text-gray-600">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="date">Date created</option>
            <option value="type">Widget type</option>
          </select>
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Loading widgets…</p>}

      {!loading && widgets.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No widgets yet — create your first one.</p>
        </div>
      )}

      {sortBy === 'date' && (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <WidgetCard key={widget.id} widget={widget} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {sortBy === 'type' && groupedByType && (
        <div className="space-y-8">
          {groupedByType.map((group) => (
            <div key={group.type}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {TYPE_LABELS[group.type] || group.type}
              </h2>
              <div className="grid gap-4">
                {group.items.map((widget) => (
                  <WidgetCard key={widget.id} widget={widget} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
