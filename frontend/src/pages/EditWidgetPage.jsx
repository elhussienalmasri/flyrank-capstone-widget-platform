import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWidget, updateWidget, listWidgets } from '../api/widgetsApi';
import WidgetForm from '../components/WidgetForm';
import AppLayout from '../components/AppLayout';

export default function EditWidgetPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [widget, setWidget] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [signupWidgets, setSignupWidgets] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getWidget(token, id)
      .then((data) => { if (!cancelled) setWidget(data); })
      .catch((err) => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, [token, id]);

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
    await updateWidget(token, id, values);
    navigate('/widgets');
  }

  return (
    <AppLayout>
      <Link to="/widgets" className="text-sm text-gray-500 hover:text-gray-800">&larr; Back to widgets</Link>
      <h1 className="text-xl font-semibold text-gray-900 mt-2 mb-6">Edit widget</h1>

      {loadError && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
          {loadError}
        </p>
      )}

      {!widget && !loadError && <p className="text-sm text-gray-500">Loading…</p>}

      {widget && (
        <WidgetForm
          initialValues={{
            type: widget.type,
            title: widget.title,
            description: widget.description,
            buttonText: widget.buttonText,
            formFields: widget.formFields,
            displayOptions: widget.displayOptions,
          }}
          onSubmit={handleSubmit}
          submitLabel="Save changes"
          signupWidgets={signupWidgets}
        />
      )}
    </AppLayout>
  );
}
