import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { InventoryPage } from './pages/InventoryPage';
import { UdhaarPage } from './pages/UdhaarPage';
import { CustomersPage } from './pages/CustomersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Protected Route Guard
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, business, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center relative overflow-hidden">
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
    <div className="min-h-screen flex flex-col bg-obsidian text-slate-100 relative overflow-x-hidden">
      {/* Dynamic Ambient Aurora Background Mesh */}
      <div className="aurora-mesh" aria-hidden="true">
        <div className="aurora-orb-1 animate-aurora-1" />
        <div className="aurora-orb-2 animate-aurora-2" />
        <div className="aurora-orb-3 animate-aurora-3" />
        <div className="aurora-grid-dots" />
      </div>

      <Navbar />
      <div className="flex-1 flex overflow-hidden relative z-10">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
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
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* Protected Business App Routes */}
                <Route path="/*" element={<ProtectedLayout />} />
              </Routes>
            </BrowserRouter>
          </OfflineProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
