// Landing page for the link in the password-reset email. Reads
// ?token= from the URL; the visitor sets a new password here.
import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPasswordRequest } from '../api/authApi';
import FormField, { inputClass } from '../components/FormField';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('No reset token was provided.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordRequest({ token, newPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Reset password</h2>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {done ? (
          <p className="text-sm text-green-600">Password reset — redirecting to log in…</p>
        ) : (
          <>
            <FormField label="New password">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
              />
            </FormField>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 text-white text-sm font-medium rounded-md py-2 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Resetting…' : 'Reset password'}
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
