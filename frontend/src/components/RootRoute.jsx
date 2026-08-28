// The "/" route: shows the public LandingPage to a logged-out
// visitor, but sends an already-authenticated user straight to
// their dashboard instead of showing them marketing copy for a
// product they've already signed up for.
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';

export default function RootRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null; // brief — avoids a landing-page flash before the session check resolves
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <LandingPage />;
}
