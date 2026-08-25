// Landing page for the link in the verification email. Reads
// ?token= from the URL and calls the backend automatically. When
// REQUIRE_EMAIL_VERIFICATION is on, this is the moment the account
// actually gets created — the backend returns a fresh tenant+token,
// which logs the person straight in instead of sending them to a
// separate login step.
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { verifyEmailRequest } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeSession } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token was provided.');
      return;
    }
    verifyEmailRequest(token)
      .then((result) => {
        if (result.created && result.tenant && result.token) {
          // The account was just created by this verification —
          // log them in immediately and go straight to the dashboard.
          completeSession({ tenant: result.tenant, token: result.token });
          navigate('/dashboard');
          return;
        }
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
        {status === 'verifying' && <p className="text-sm text-gray-500">Verifying your email…</p>}

        {status === 'success' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Email verified</h2>
            <p className="text-sm text-gray-500 mb-4">Your email address has been confirmed.</p>
            <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">Go to dashboard</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Link to="/login" className="text-sm text-indigo-600 hover:underline">Back to log in</Link>
          </>
        )}
      </div>
    </div>
  );
}
