import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import { PageLoader } from './components/ui/index';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// App pages (lazy)
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const RequirementsPage = lazy(() => import('./pages/requirements/RequirementsPage'));
const NewRequirementPage = lazy(() => import('./pages/requirements/NewRequirementPage'));
const RequirementDetailPage = lazy(() => import('./pages/requirements/RequirementDetailPage'));
const EditRequirementPage = lazy(() => import('./pages/requirements/EditRequirementPage'));
const VendorsPage = lazy(() => import('./pages/vendors/VendorsPage'));
const QuotationsPage = lazy(() => import('./pages/quotations/QuotationsPage'));
const ComparisonsPage = lazy(() => import('./pages/comparisons/ComparisonsPage'));
const NewComparisonPage = lazy(() => import('./pages/comparisons/NewComparisonPage'));
const ComparisonDetailPage = lazy(() => import('./pages/comparisons/ComparisonDetailPage'));
const HistoryPage = lazy(() => import('./pages/history/HistoryPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* All authenticated routes wrap inside ProtectedRoute → AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
              <Route path="/requirements" element={<Suspense fallback={<PageLoader />}><RequirementsPage /></Suspense>} />
              <Route path="/requirements/new" element={<Suspense fallback={<PageLoader />}><NewRequirementPage /></Suspense>} />
              <Route path="/requirements/:id" element={<Suspense fallback={<PageLoader />}><RequirementDetailPage /></Suspense>} />
              <Route path="/requirements/:id/edit" element={<Suspense fallback={<PageLoader />}><EditRequirementPage /></Suspense>} />
              <Route path="/vendors" element={<Suspense fallback={<PageLoader />}><VendorsPage /></Suspense>} />
              <Route path="/quotations" element={<Suspense fallback={<PageLoader />}><QuotationsPage /></Suspense>} />
              <Route path="/comparisons" element={<Suspense fallback={<PageLoader />}><ComparisonsPage /></Suspense>} />
              <Route path="/comparisons/new" element={<Suspense fallback={<PageLoader />}><NewComparisonPage /></Suspense>} />
              <Route path="/comparisons/:id" element={<Suspense fallback={<PageLoader />}><ComparisonDetailPage /></Suspense>} />
              <Route path="/history" element={<Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
            </Route>
          </Route>

          {/* Admin-only routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/users" element={<Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense>} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
