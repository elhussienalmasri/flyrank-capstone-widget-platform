import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPasswordRequest } from '../api/authApi';
import FormField, { inputClass } from '../components/FormField';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPasswordRequest(email);
      setSent(true); // same message whether or not the account exists
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Forgot password</h2>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {sent ? (
          <p className="text-sm text-gray-600">
            If an account exists for that email, a reset link has been sent.
          </p>
        ) : (
          <>
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </FormField>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </>
        )}

        <p className="text-sm text-gray-500 mt-4 text-center">
          <Link to="/login" className="text-indigo-600 hover:underline">Back to log in</Link>
        </p>
      </form>
    </div>
  );
}
