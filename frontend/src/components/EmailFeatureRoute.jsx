import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getConfig } from '../api/configApi';

// Prevent direct navigation to screens that only work when the platform can
// actually deliver email. Fail closed if the public config request fails.
export default function EmailFeatureRoute({ children }) {
  const [emailEnabled, setEmailEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getConfig()
      .then((config) => { if (!cancelled) setEmailEnabled(config.emailEnabled === true); })
      .catch(() => { if (!cancelled) setEmailEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  if (emailEnabled === null) return null;
  return emailEnabled ? children : <Navigate to="/login" replace />;
}
