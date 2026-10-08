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

export default function TransactionsPage({ token, data, onRefresh }) {
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // New Transaction Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { transactions = [] } = data || {};

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
    if (search.trim() && !tx.title.toLowerCase().includes(search.toLowerCase().trim())) {
      return false;
    }
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
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

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Amount must be greater than zero');
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

      setTitle('');
      setAmount('');
      setType('expense');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      setFormError(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Spending breakdown by category for expenses
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpenseSum = expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0);
  const categoryTotals = {};
  expenseTransactions.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
  });

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="dashboard-banner">
        <div>
          <h2>Transaction History & Analytics</h2>
          <p className="text-muted">Review, filter, and track all your cash flow records.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Transaction
        </button>
      </div>

      {/* Category Expense Breakdown */}
      {totalExpenseSum > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h3>Expense Category Breakdown</h3>
            <span className="badge">Total Spent: ₹{totalExpenseSum.toLocaleString()}</span>
          </div>
          <div className="category-breakdown-grid">
            {Object.entries(categoryTotals).map(([cat, amt]) => {
              const pct = Math.round((amt / totalExpenseSum) * 100);
              return (
                <div key={cat} className="breakdown-card">
                  <div className="breakdown-meta">
                    <span className="breakdown-title">{cat}</span>
                    <span className="breakdown-amt">₹{amt.toLocaleString()}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill progress-normal" style={{ width: `${pct}%` }} />
                  </div>
                  <small className="text-muted">{pct}% of total expenses</small>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="card filter-card">
        <div className="filter-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All Types (Income & Expenses)</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3>Records ({filtered.length})</h3>
          {(filterType !== 'all' || filterCategory !== 'all' || search) && (
            <button
              className="btn-link"
              onClick={() => {
                setFilterType('all');
                setFilterCategory('all');
                setSearch('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No matching transactions found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-muted">{tx.date}</td>
                    <td className="font-semibold">{tx.title}</td>
                    <td>
                      <span className="category-pill">{tx.category}</span>
                    </td>
                    <td>
                      <span className={`type-badge ${tx.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`font-semibold ${tx.type === 'income' ? 'income-text' : 'expense-text'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{Number(tx.amount).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn-icon delete-btn"
                        title="Delete record"
                        disabled={deletingId === tx.id}
                        onClick={() => handleDelete(tx.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Transaction</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}>×</button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleCreate}>
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
                <label>Title / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Electric bill, Freelance payout"
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
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                  {submitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
