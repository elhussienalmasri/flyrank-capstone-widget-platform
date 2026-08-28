// Login. Backend returns the same error for "no such
// email" and "wrong password" — we surface it as-is, don't guess.
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField, { inputClass } from '../components/FormField';
import { getConfig } from '../api/configApi';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getConfig()
      .then((config) => { if (!cancelled) setEmailEnabled(config.emailEnabled === true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function handleChange(e) {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const result = await login(formValues);
      navigate(result.tenant.role === 'admin' ? '/admin/accounts' : '/dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Log in</h2>

        {formError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {formError}
          </p>
        )}

        <FormField label="Email">
          <input
            type="email"
            name="email"
            value={formValues.email}
            onChange={handleChange}
            autoComplete="email"
            className={inputClass}
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password"
            name="password"
            value={formValues.password}
            onChange={handleChange}
            autoComplete="current-password"
            className={inputClass}
          />
        </FormField>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        {emailEnabled && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
          </p>
        )}

        <p className={`text-sm text-gray-500 ${emailEnabled ? 'mt-2' : 'mt-3'} text-center`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">Create one</Link>
        </p>
      </form>
    </div>
  );
}
