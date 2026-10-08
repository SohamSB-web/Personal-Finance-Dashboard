import React, { useState, useEffect } from 'react';
import { api } from './api';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import './App.css';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('pfd_token') || '');
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'transactions'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Handle successful login
  const handleLoginSuccess = (newToken, user) => {
    localStorage.setItem('pfd_token', newToken);
    localStorage.setItem('pfd_user', JSON.stringify(user));
    setToken(newToken);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('pfd_token');
    localStorage.removeItem('pfd_user');
    setToken('');
    setDashboardData(null);
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    setGlobalError('');
    try {
      const data = await api.getDashboard(token);
      setDashboardData(data);
    } catch (err) {
      if (err.message && (err.message.includes('expired') || err.message.includes('token') || err.message.includes('401'))) {
        handleLogout();
      } else {
        setGlobalError(err.message || 'Failed to connect to backend server');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Page 1: If not authenticated, render AuthPage
  if (!token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand" onClick={() => setCurrentPage('dashboard')}>
            <span className="logo-symbol">₹</span>
            <div>
              <span className="brand-title">FinanceDesk</span>
              <span className="brand-tagline">Minimoth Auth</span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              className={`nav-btn ${currentPage === 'dashboard' ? 'nav-btn-active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-btn ${currentPage === 'transactions' ? 'nav-btn-active' : ''}`}
              onClick={() => setCurrentPage('transactions')}
            >
              Transactions
            </button>
          </nav>

          <div className="nav-user">
            <div className="user-info">
              <span className="user-name">{dashboardData?.user?.name || 'User'}</span>
              <span className="user-phone">{dashboardData?.user?.phone}</span>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {globalError && (
          <div className="alert alert-error mb-4">
            {globalError}
            <button className="btn-link ml-2" onClick={fetchDashboardData}>
              Retry
            </button>
          </div>
        )}

        {loading && !dashboardData ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading your financial records...</p>
          </div>
        ) : currentPage === 'dashboard' ? (
          // Page 2: Dashboard Overview
          <DashboardPage
            token={token}
            data={dashboardData}
            onRefresh={fetchDashboardData}
            onNavigate={(page) => setCurrentPage(page)}
          />
        ) : (
          // Page 3: Transactions & Analytics
          <TransactionsPage
            token={token}
            data={dashboardData}
            onRefresh={fetchDashboardData}
          />
        )}
      </main>

      <footer className="footer">
        <p>Personal Finance Dashboard • Workshop Project • OTP verified via Minimoth API</p>
      </footer>
    </div>
  );
}
