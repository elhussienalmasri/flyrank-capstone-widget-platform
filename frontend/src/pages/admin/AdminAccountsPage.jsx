// The core admin screen: every tenant account, each with their
// widgets listed underneath. Deleting an account is permanent and
// cascades — the confirm dialog says so explicitly before anything
// is sent to the API.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listAccounts, deleteAccount } from '../../api/adminApi';
import AdminLayout from '../../components/AdminLayout';

const TYPE_LABELS = {
  subscribe: 'Subscribe',
  signup: 'Sign up',
  login: 'Log in',
  cta: 'Call to action',
  popover: 'Popover',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

export default function AdminAccountsPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listAccounts(token);
      setAccounts(data);
    } catch (err) {
      if (err.status === 401) {
        // Token expired/invalid — send them back to log in again.
        logout();
        navigate('/login');
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(account) {
    const widgetCount = account.widgets.length;
    const confirmed = confirm(
      `Delete the account "${account.companyName}" (${account.email})?\n\n` +
      `This will permanently delete this account and all ${widgetCount} associated widget${widgetCount === 1 ? '' : 's'} ` +
      `— along with their submissions and visitor accounts. This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(account.id);
    setError('');
    try {
      await deleteAccount(token, account.id);
      setAccounts((prev) => prev.filter((a) => a.id !== account.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Widget owner accounts</h1>
        <span className="text-sm text-gray-500">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-gray-500">Loading accounts…</p>}

      {!loading && accounts.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="text-sm text-gray-500">No accounts yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{account.companyName}</h3>
                <p className="text-sm text-gray-500">{account.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Joined {formatDate(account.createdAt)} ·{' '}
                  {account.emailVerified ? (
                    <span className="text-green-600">Email verified</span>
                  ) : (
                    <span className="text-amber-600">Email not verified</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => handleDelete(account)}
                disabled={deletingId === account.id}
                className="text-sm font-medium text-red-600 border border-red-300 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-50 transition"
              >
                {deletingId === account.id ? 'Deleting…' : 'Delete account'}
              </button>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Widgets ({account.widgets.length})
              </p>
              {account.widgets.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No widgets yet.</p>
              ) : (
                <ul className="space-y-1">
                  {account.widgets.map((widget) => (
                    <li key={widget.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full px-2 py-0.5">
                        {TYPE_LABELS[widget.type] || widget.type}
                      </span>
                      <span>{widget.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
