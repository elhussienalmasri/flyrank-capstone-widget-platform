// Account creation. Collects companyName/email/password,
// registers via AuthContext, redirects to the dashboard on success.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FormField, { inputClass } from '../components/FormField';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({ companyName: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');

  function handleChange(e) {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});
    setSubmitting(true);

    try {
      const result = await register(formValues);
      if (result.pending) {
        // Verification is required before the account exists —
        // nothing to log into yet, just tell them to check their inbox.
        setPendingMessage(result.message);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.details) {
        const mapped = {};
        err.details.forEach((d) => { mapped[d.field] = d.message; });
        setFieldErrors(mapped);
      } else {
        setFormError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

        {formError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {formError}
          </p>
        )}

        {pendingMessage ? (
          <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-3">
            {pendingMessage}
          </p>
        ) : (
          <>
            <FormField label="Company name" error={fieldErrors.companyName}>
              <input
                name="companyName"
                value={formValues.companyName}
                onChange={handleChange}
                autoComplete="organization"
                className={inputClass}
              />
            </FormField>

            <FormField label="Email" error={fieldErrors.email}>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                autoComplete="email"
                className={inputClass}
              />
            </FormField>

            <FormField label="Password" error={fieldErrors.password}>
              <input
                type="password"
                name="password"
                value={formValues.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={inputClass}
              />
            </FormField>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
