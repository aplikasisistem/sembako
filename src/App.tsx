/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
import { POSPage } from './pages/POSPage';

// Code Splitting / Lazy Loading for heavy secondary pages
const TransactionsPage = lazy(() => import('./pages/TransactionsPage').then((m) => ({ default: m.TransactionsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const StockOpnamePage = lazy(() => import('./pages/StockOpnamePage').then((m) => ({ default: m.StockOpnamePage })));
const DebtPage = lazy(() => import('./pages/DebtPage').then((m) => ({ default: m.DebtPage })));
const PettyCashPage = lazy(() => import('./pages/PettyCashPage').then((m) => ({ default: m.PettyCashPage })));
const ClosingPage = lazy(() => import('./pages/ClosingPage').then((m) => ({ default: m.ClosingPage })));
const FinancePage = lazy(() => import('./pages/FinancePage').then((m) => ({ default: m.FinancePage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

/**
 * Lightweight Skeleton Loader for lazy-loaded tabs
 */
const PageSkeleton: React.FC = () => (
  <div className="p-4 sm:p-6 space-y-4 animate-pulse font-sans">
    <div className="h-8 bg-[#252a36] rounded-xl w-48 border border-[#32384a]" />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="h-24 bg-[#252a36] rounded-2xl border border-[#32384a]" />
      <div className="h-24 bg-[#252a36] rounded-2xl border border-[#32384a]" />
      <div className="h-24 bg-[#252a36] rounded-2xl border border-[#32384a]" />
    </div>
    <div className="h-64 bg-[#252a36] rounded-2xl border border-[#32384a] w-full" />
  </div>
);

const MainLayout: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('pos');

  // Strict Login First Route Guard (Section 9.2)
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin access guard: If a cashier somehow sets an admin-only tab, revert to POS
  const currentTab = (activeTab === 'finance' || activeTab === 'users' || activeTab === 'settings') && !isAdmin
    ? 'pos'
    : activeTab;

  return (
    <div className="min-h-screen bg-[#161922] flex flex-col text-slate-100 font-sans selection:bg-emerald-500 selection:text-white pb-20 lg:pb-0">
      {/* Top Header with PANDIR STORE Logo and System Indicators */}
      <Header />

      {/* Responsive Content Body */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Navigation Sidebar for Desktop & Bottom Bar for Mobile */}
        <Navigation activeTab={currentTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page Views with Suspense for instant initial load */}
        <main className="flex-1 w-full">
          <Suspense fallback={<PageSkeleton />}>
            {currentTab === 'pos' && <POSPage />}
            {currentTab === 'transactions' && <TransactionsPage />}
            {currentTab === 'inventory' && <InventoryPage />}
            {currentTab === 'stockOpname' && <StockOpnamePage />}
            {currentTab === 'debts' && <DebtPage />}
            {currentTab === 'pettyCash' && <PettyCashPage />}
            {currentTab === 'closing' && <ClosingPage />}
            {currentTab === 'finance' && <FinancePage />}
            {currentTab === 'users' && <UsersPage />}
            {currentTab === 'settings' && <SettingsPage />}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <MainLayout />
      </StoreProvider>
    </AuthProvider>
  );
}
