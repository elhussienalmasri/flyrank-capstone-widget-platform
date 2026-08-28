import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import EmailFeatureRoute from './components/EmailFeatureRoute';
import RootRoute from './components/RootRoute';

import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WidgetsListPage from './pages/WidgetsListPage';
import CreateWidgetPage from './pages/CreateWidgetPage';
import EditWidgetPage from './pages/EditWidgetPage';
import SubmissionsPage from './pages/SubmissionsPage';
import VisitorsPage from './pages/VisitorsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminAccountsPage from './pages/admin/AdminAccountsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public marketing page — redirects to /dashboard if already logged in */}
          <Route path="/" element={<RootRoute />} />

          {/* Account. Login is shared by everyone, including
              the admin — LoginPage routes to /admin/accounts or
              /dashboard based on the returned tenant.role. */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<EmailFeatureRoute><VerifyEmailPage /></EmailFeatureRoute>} />
          <Route path="/forgot-password" element={<EmailFeatureRoute><ForgotPasswordPage /></EmailFeatureRoute>} />
          <Route path="/reset-password" element={<EmailFeatureRoute><ResetPasswordPage /></EmailFeatureRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* Widgets */}
          <Route path="/widgets" element={<ProtectedRoute><WidgetsListPage /></ProtectedRoute>} />
          <Route path="/widgets/new" element={<ProtectedRoute><CreateWidgetPage /></ProtectedRoute>} />
          <Route path="/widgets/:id/edit" element={<ProtectedRoute><EditWidgetPage /></ProtectedRoute>} />

          {/* Submissions from customer websites */}
          <Route path="/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />

          {/* Registered accounts from signup widgets */}
          <Route path="/visitors" element={<ProtectedRoute><VisitorsPage /></ProtectedRoute>} />

          {/* Platform admin — same login as everyone, gated by role */}
          <Route path="/admin/accounts" element={<AdminProtectedRoute><AdminAccountsPage /></AdminProtectedRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/accounts" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
