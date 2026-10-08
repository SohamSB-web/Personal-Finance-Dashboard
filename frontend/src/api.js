const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  // 1. Send OTP via Minimoth
  sendOtp: async (phone) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  // 2. Verify OTP & authenticate
  verifyOtp: async (phone, code, name) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    return data;
  },

  // 3. Fetch dashboard metrics & transactions
  getDashboard: async (token) => {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load dashboard');
    return data;
  },

  // 4. Create new transaction
  createTransaction: async (token, transactionData) => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create transaction');
    return data;
  },

  // 5. Delete transaction
  deleteTransaction: async (token, id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete transaction');
    return data;
  },
};
