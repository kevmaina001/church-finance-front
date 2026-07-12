import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VoteheadManagement from './pages/VoteheadManagement';
import Expenditure from './pages/Expenditure';
import Report from './pages/Report';
import Visualization from './pages/Visualization';
import AccountingReports from './pages/AccountingReports';
import AccountManagement from './pages/AccountManagement';
import JournalEntries from './pages/JournalEntries';
import RevenueSourceManagement from './pages/RevenueSourceManagement';
import UserManagement from './pages/UserManagement';
import LocalChurchManagement from './pages/LocalChurchManagement';

// A component to handle the root URL redirect logic
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  // If a token exists, the user is likely logged in. Redirect to the app.
  // Otherwise, send them to the login page.
  return token ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Add the new root route handler */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Public Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Pages with MainLayout as a wrapper, now under /app */}
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="income" element={<Income />} />
          <Route path="expenditure" element={<Expenditure />} />
          <Route path="voteheads" element={<VoteheadManagement />} />
          <Route path="reports" element={<Report />} />
          <Route path="visualization" element={<Visualization />} />
          <Route path="accounting" element={<AccountingReports />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="journal-entries" element={<JournalEntries />} />
          <Route path="revenue-sources" element={<RevenueSourceManagement />} />
          <Route path="local-churches" element={<LocalChurchManagement />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App; 