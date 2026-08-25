// Change password while logged in — needs the current password,
// works regardless of the email-features toggle (no email involved).
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePasswordRequest } from '../api/authApi';
import AppLayout from '../components/AppLayout';
import FormField, { inputClass } from '../components/FormField';

export default function ChangePasswordPage() {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      await changePasswordRequest(token, { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Change password</h1>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-4">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-md px-3 py-2 mb-4">
            Password changed.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputClass}
            />
          </FormField>

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
            className="bg-indigo-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Saving…' : 'Change password'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
