import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Reports = lazy(() => import('./pages/Reports'));
const SecurityMonitor = lazy(() => import('./pages/SecurityMonitor'));
const GestureMonitor = lazy(() => import('./pages/GestureMonitor'));
const AdminProfile = lazy(() => import('./pages/AdminProfile'));

function PageLoading() {
  return (
    <div className="flex min-h-40 flex-1 items-center justify-center p-8 text-sm font-semibold text-slate-500 dark:text-gray-400" role="status">
      Loading page...
    </div>
  );
}

function lazyPage(Page) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Page />
    </Suspense>
  );
}

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token'));

  return (
    <Routes>
      {/* If logged in, don't show login page; go straight to overview */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : lazyPage(Login)} />
      
      {/* Protect the entire Layout. If NOT authenticated, force them back to /login */}
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={lazyPage(Dashboard)} />
        <Route path="Overview" element={<Navigate to="/overview" replace />} />
        <Route path="members" element={lazyPage(Members)} />
        <Route path="subscriptions" element={lazyPage(Subscriptions)} />
        <Route path="transactions" element={lazyPage(Transactions)} />
        <Route path="reports" element={lazyPage(Reports)} />
        <Route path="security" element={lazyPage(SecurityMonitor)} />
        <Route path="gesture" element={lazyPage(GestureMonitor)} />
        <Route path="profile" element={lazyPage(AdminProfile)} />
      </Route>
    </Routes>
  );
}
export default App;