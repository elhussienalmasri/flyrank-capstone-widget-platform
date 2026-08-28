// Landing page after login — confirms the account, shows the
// aggregate stats snapshot (the ONLY place these numbers appear —
// not duplicated on /submissions), and links out to the three main
// areas. Account actions (change password, log out) live in a
// dropdown instead of sitting as separate buttons.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOverview } from '../api/dashboardApi';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import AccountMenu from '../components/AccountMenu';

export default function DashboardPage() {
  const { tenant, token } = useAuth();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getOverview(token)
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch(() => {}); // non-critical for this page — just skip the stats row
    return () => { cancelled = true; };
  }, [token]);

  return (
    <AppLayout>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Welcome, {tenant.companyName}</h1>
            <p className="text-sm text-gray-500 mt-1">Logged in as {tenant.email}</p>
            <p className="text-xs text-gray-400 mt-1">
              Account created {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
          <AccountMenu />
        </div>

        <div className="flex gap-3 mt-6">
          <Link
            to="/widgets"
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 transition"
          >
            Create widgets
          </Link>
          <Link
            to="/submissions"
            className="border border-gray-300 text-gray-700 text-sm font-medium rounded-md px-4 py-2 hover:bg-gray-50 transition"
          >
            View submissions
          </Link>
          <Link
            to="/visitors"
            className="border border-gray-300 text-gray-700 text-sm font-medium rounded-md px-4 py-2 hover:bg-gray-50 transition"
          >
            View visitors
          </Link>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total submissions" value={overview.totalSubmissions} />
          <StatCard label="Total visitors" value={overview.totalVisitors} />
          <StatCard label="Countries reached" value={overview.submissionsByCountry.length} />
          <StatCard label="Total widgets" value={overview.totalWidgets} />
        </div>
      )}
    </AppLayout>
  );
}
