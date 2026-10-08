import React, { useState } from 'react';
import { api } from '../api';

const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Salary',
  'Investment',
  'Entertainment',
  'Other',
];

export default function DashboardPage({ token, data, onRefresh, onNavigate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { summary, budgets = [], transactions = [], user } = data || {};

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a title');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await api.createTransaction(token, {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        date,
      });

      // Reset form
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory('Food & Dining');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    setDeletingId(id);
    try {
      await api.deleteTransaction(token, id);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setDeletingId(null);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div className="dashboard-banner">
        <div>
          <h2>Welcome back, {user?.name || 'Saver'}! 👋</h2>
          <p className="text-muted">Here is your financial overview and spending summary for this month.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Record Transaction
        </button>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card balance-card">
          <div className="stat-label">Net Balance</div>
          <div className="stat-value">
            {summary?.totalBalance >= 0 ? '₹' : '-₹'}
            {Math.abs(summary?.totalBalance || 0).toLocaleString()}
          </div>
          <div className="stat-subtext">Current overall standing</div>
        </div>

        <div className="stat-card income-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value income-text">
            +₹{(summary?.totalIncome || 0).toLocaleString()}
          </div>
          <div className="stat-subtext">Earnings recorded</div>
        </div>

        <div className="stat-card expense-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value expense-text">
            -₹{(summary?.totalExpenses || 0).toLocaleString()}
          </div>
          <div className="stat-subtext">Total spending recorded</div>
        </div>

        <div className="stat-card savings-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value highlight-text">
            {summary?.savingsRate || 0}%
          </div>
          <div className="stat-subtext">Income retained</div>
        </div>
      </div>

      {/* Main Grid: Budgets & Recent Transactions */}
      <div className="dashboard-grid">
        {/* Budgets Section */}
        <div className="card">
          <div className="card-header">
            <h3>Budget Tracking</h3>
            <span className="badge">Monthly Limits</span>
          </div>
          <div className="budgets-list">
            {budgets.length === 0 ? (
              <p className="text-muted py-4">No budget categories defined.</p>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="budget-item">
                  <div className="budget-meta">
                    <span className="budget-category">{b.category}</span>
                    <span className="budget-amounts">
                      ₹{b.spent.toLocaleString()} / ₹{b.monthly_limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className={`progress-fill ${b.isOverBudget ? 'progress-danger' : b.percentage > 75 ? 'progress-warning' : 'progress-normal'}`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                  <div className="budget-sub">
                    <small>{b.percentage}% used</small>
                    {b.isOverBudget && <small className="text-danger">Exceeded budget</small>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="btn-link" onClick={() => onNavigate('transactions')}>
              View All ({transactions.length}) →
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions recorded yet.</p>
              <button className="btn btn-secondary btn-sm mt-2" onClick={() => setShowAddModal(true)}>
                Add your first one
              </button>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-left">
                    <div className={`tx-icon ${tx.type === 'income' ? 'tx-icon-income' : 'tx-icon-expense'}`}>
                      {tx.type === 'income' ? '↓' : '↑'}
                    </div>
                    <div>
                      <div className="tx-title">{tx.title}</div>
                      <div className="tx-meta">
                        {tx.category} • {tx.date}
                      </div>
                    </div>
                  </div>
                  <div className="tx-right">
                    <span className={`tx-amount ${tx.type === 'income' ? 'income-text' : 'expense-text'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                    </span>
                    <button
                      className="btn-icon"
                      title="Delete"
                      disabled={deletingId === tx.id}
                      onClick={() => handleDelete(tx.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record New Transaction</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleCreateTransaction}>
              {/* Type Toggle */}
              <div className="type-toggle">
                <button
                  type="button"
                  className={`toggle-btn ${type === 'expense' ? 'active-expense' : ''}`}
                  onClick={() => setType('expense')}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${type === 'income' ? 'active-income' : ''}`}
                  onClick={() => setType('income')}
                >
                  Income
                </button>
              </div>

              <div className="form-group">
                <label>Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Grocery store, Freelance, Coffee"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
