import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Subscriptions from './pages/Subscriptions';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import SecurityMonitor from './pages/SecurityMonitor';
import GestureMonitor from './pages/GestureMonitor';
import AdminProfile from './pages/AdminProfile';

function App() {
  // Check if token exists in local storage
  const isAuthenticated = !!localStorage.getItem('admin_token');

  return (
    <Routes>
      {/* If logged in, don't show login page; go straight to overview */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/overview" replace /> : <Login />} />
      
      {/* Protect the entire Layout. If NOT authenticated, force them back to /login */}
      <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview" element={<Dashboard />} />
        <Route path="Overview" element={<Navigate to="/overview" replace />} />
        <Route path="members" element={<Members />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="reports" element={<Reports />} />
        <Route path="security" element={<SecurityMonitor />} />
        <Route path="gesture" element={<GestureMonitor />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
    </Routes>
  );
}
export default App;