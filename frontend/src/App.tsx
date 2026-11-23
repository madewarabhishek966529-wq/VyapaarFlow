import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PageSkeleton } from './components/PageSkeleton';

// Code-split pages for instant initial load and smooth transitions
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const PosPage = lazy(() => import('./pages/PosPage').then(m => ({ default: m.PosPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(m => ({ default: m.InventoryPage })));
const UdhaarPage = lazy(() => import('./pages/UdhaarPage').then(m => ({ default: m.UdhaarPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then(m => ({ default: m.CustomersPage })));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage').then(m => ({ default: m.SuppliersPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then(m => ({ default: m.ExpensesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));

// Optimized QueryClient with 30s stale time to eliminate loading flickers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000
    }
  }
});

// Protected Route Guard
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, business, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center relative overflow-hidden">
        <div className="aurora-mesh" aria-hidden="true">
          <div className="aurora-orb-1 animate-aurora-1" />
          <div className="aurora-orb-2 animate-aurora-2" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-aurora-purple border-t-transparent rounded-full animate-spin shadow-glow-purple"></div>
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading VyapaarFlow...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has not onboarded a business yet and not currently on /onboarding
  if (!business && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100 relative overflow-x-hidden selection:bg-aurora-purple selection:text-white">
      {/* Dynamic Ambient Aurora Background Mesh (Hardware Accelerated) */}
      <div className="aurora-mesh" aria-hidden="true">
        <div className="aurora-orb-1 animate-aurora-1" />
        <div className="aurora-orb-2 animate-aurora-2" />
        <div className="aurora-orb-3 animate-aurora-3" />
        <div className="aurora-grid-dots" />
      </div>

      <Navbar />
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 scroll-smooth">
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/udhaar" element={<UdhaarPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <OfflineProvider>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-coral border-t-transparent rounded-full animate-spin shadow-glow-coral"></div>
                  </div>
                }
              >
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />

                  {/* Protected Business App Routes */}
                  <Route path="/*" element={<ProtectedLayout />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </OfflineProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
