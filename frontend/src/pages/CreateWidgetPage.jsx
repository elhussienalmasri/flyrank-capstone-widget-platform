import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createWidget, listWidgets } from '../api/widgetsApi';
import WidgetForm from '../components/WidgetForm';
import AppLayout from '../components/AppLayout';

export default function CreateWidgetPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [signupWidgets, setSignupWidgets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    // Needed for the login-widget "link to a signup widget" dropdown
    // — only actually shown when there's more than one.
    listWidgets(token)
      .then((widgets) => { if (!cancelled) setSignupWidgets(widgets.filter((w) => w.type === 'signup')); })
      .catch(() => {}); // non-critical — LoginSettings just won't show the dropdown
    return () => { cancelled = true; };
  }, [token]);

  async function handleSubmit(values) {
    await createWidget(token, values);
    navigate('/widgets');
  }

  return (
    <AppLayout>
      <Link to="/widgets" className="text-sm text-gray-500 hover:text-gray-800">&larr; Back to widgets</Link>
      <h1 className="text-xl font-semibold text-gray-900 mt-2 mb-6">Create widget</h1>
      <WidgetForm onSubmit={handleSubmit} submitLabel="Create widget" signupWidgets={signupWidgets} />
    </AppLayout>
  );
}
