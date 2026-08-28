// Single source of truth for auth state: current tenant, token, and
// the actions (register/login/logout) that mutate it. Persists the
// token in localStorage so a refresh doesn't log the owner out.
import { createContext, useContext, useEffect, useState } from 'react';
import { registerRequest, loginRequest, meRequest } from '../api/authApi';

const AuthContext = createContext(null);
const TOKEN_KEY = 'widget_platform_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { tenant: fetchedTenant } = await meRequest(token);
        if (!cancelled) setTenant(fetchedTenant);
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setTenant(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, [token]);

  function persistSession({ tenant: newTenant, token: newToken }) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setTenant(newTenant);
  }

  async function register(formValues) {
    const result = await registerRequest(formValues);
    // A pending result has no tenant/token yet — the account isn't
    // created until the verification link is clicked (see
    // VerifyEmailPage, which calls completeSession once it is).
    if (!result.pending) {
      persistSession(result);
    }
    return result;
  }

  async function login(formValues) {
    const result = await loginRequest(formValues);
    persistSession(result);
    return result;
  }

  // Called by VerifyEmailPage once a deferred registration is
  // confirmed — the backend creates the account at that exact
  // moment and returns a fresh tenant+token, so this logs them
  // straight in instead of making them go log in separately.
  function completeSession({ tenant: newTenant, token: newToken }) {
    persistSession({ tenant: newTenant, token: newToken });
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setTenant(null);
  }

  const value = {
    token,
    tenant,
    isAuthenticated: Boolean(token && tenant),
    loading,
    register,
    login,
    logout,
    completeSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
