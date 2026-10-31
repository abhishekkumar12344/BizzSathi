import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layouts
import { PublicLayout } from './layouts/PublicLayout.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

// Pages
import { LandingPage } from './pages/public/LandingPage.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { CreateSalePage } from './pages/sales/CreateSalePage.js';
import { SalesListPage } from './pages/sales/SalesListPage.js';
import { ProductListPage } from './pages/products/ProductListPage.js';
import { CategoryListPage } from './pages/categories/CategoryListPage.js';
import { CustomerListPage } from './pages/customers/CustomerListPage.js';
import { SupplierListPage } from './pages/suppliers/SupplierListPage.js';
import { ExpenseListPage } from './pages/expenses/ExpenseListPage.js';
import { ReportsPage } from './pages/reports/ReportsPage.js';
import { BusinessSettingsPage } from './pages/settings/BusinessSettingsPage.js';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="brand-badge" style={{ margin: '0 auto 1rem', padding: '0.6rem 0.8rem', fontSize: '1.25rem' }}>
            BS
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
            Loading BizSathi...
          </div>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.role !== 'PLATFORM_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Marketing Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Dashboard Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales/new" element={<CreateSalePage />} />
              <Route path="/sales" element={<SalesListPage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/categories" element={<CategoryListPage />} />
              <Route path="/customers" element={<CustomerListPage />} />
              <Route path="/suppliers" element={<SupplierListPage />} />
              <Route path="/expenses" element={<ExpenseListPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<BusinessSettingsPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
