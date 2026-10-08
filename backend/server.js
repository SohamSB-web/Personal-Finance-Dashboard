require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const {
  getUserByPhone,
  getUserById,
  createUser,
  getTransactionsByUserId,
  createTransaction,
  deleteTransaction,
  getBudgetsByUserId,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'personal_finance_secret_key_2025';
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY;

app.use(cors());
app.use(express.json());

// Helper to normalize phone number to E.164
function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  let cleaned = String(rawPhone).trim().replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    // Default to +91 if 10-digit Indian number or similar
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token' });
  }
}

// ==========================================
// 5 BACKEND API ENDPOINTS
// ==========================================

// Endpoint 1: Send OTP via Minimoth API
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const formattedPhone = normalizePhone(phone);

    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone number with country code' });
    }

    if (!MINIMOTH_API_KEY) {
      return res.status(500).json({ success: false, error: 'Minimoth API key is missing in backend configuration' });
    }

    // Call Minimoth API
    const minimothRes = await fetch('https://api.minimoth.dev/v1/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY,
      },
      body: JSON.stringify({ phone: formattedPhone }),
    });

    const data = await minimothRes.json();

    if (!minimothRes.ok) {
      return res.status(minimothRes.status).json({
        success: false,
        error: data.error || data.message || 'Failed to send OTP via Minimoth',
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully via WhatsApp / SMS',
      phone: formattedPhone,
      otp_id: data.otp_id || null,
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    return res.status(500).json({ success: false, error: 'Internal server error while sending OTP' });
  }
});

// Endpoint 2: Verify OTP via Minimoth API & Register/Login User
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    const formattedPhone = normalizePhone(phone);

    if (!formattedPhone || !code) {
      return res.status(400).json({ success: false, error: 'Phone number and 6-digit OTP code are required' });
    }

    const cleanCode = String(code).trim();
    if (cleanCode.length < 4 || cleanCode.length > 8) {
      return res.status(400).json({ success: false, error: 'Please enter a valid OTP code' });
    }

    // Call Minimoth API to verify OTP
    const minimothRes = await fetch('https://api.minimoth.dev/v1/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY,
      },
      body: JSON.stringify({ phone: formattedPhone, code: cleanCode }),
    });

    const data = await minimothRes.json();

    if (!minimothRes.ok) {
      return res.status(minimothRes.status).json({
        success: false,
        error: data.error || data.message || 'Invalid or expired OTP code',
      });
    }

    // Find or create user
    let user = getUserByPhone(formattedPhone);
    if (!user) {
      user = createUser(formattedPhone, (name && name.trim()) || 'Finance Explorer');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
});

// Endpoint 3: Dashboard Overview & Transactions
app.get('/api/dashboard', authMiddleware, (req, res) => {
  try {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found' });
    }

    const transactions = getTransactionsByUserId(user.id);
    const budgets = getBudgetsByUserId(user.id);

    // Compute Summary Metrics
    let totalIncome = 0;
    let totalExpenses = 0;
    const categorySpending = {};

    transactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += Number(tx.amount);
      } else if (tx.type === 'expense') {
        totalExpenses += Number(tx.amount);
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + Number(tx.amount);
      }
    });

    const totalBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

    // Enhance Budgets with current spending
    const budgetsWithSpent = budgets.map((b) => {
      const spent = categorySpending[b.category] || 0;
      const percentage = b.monthly_limit > 0 ? Math.min(100, Math.round((spent / b.monthly_limit) * 100)) : 0;
      return {
        ...b,
        spent,
        percentage,
        isOverBudget: spent > b.monthly_limit,
      };
    });

    return res.json({
      success: true,
      user,
      summary: {
        totalBalance,
        totalIncome,
        totalExpenses,
        savingsRate,
        transactionCount: transactions.length,
      },
      budgets: budgetsWithSpent,
      transactions,
    });
  } catch (err) {
    console.error('Error in get dashboard:', err);
    return res.status(500).json({ success: false, error: 'Failed to load dashboard data' });
  }
});

// Endpoint 4: Create Transaction
app.post('/api/transactions', authMiddleware, (req, res) => {
  try {
    const { title, amount, type, category, date } = req.body;

    // Basic Input Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ success: false, error: "Type must be either 'income' or 'expense'" });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({ success: false, error: 'Category is required' });
    }

    const txDate = date && !isNaN(new Date(date).getTime())
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const newTx = createTransaction(req.user.id, {
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: category.trim(),
      date: txDate,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      transaction: newTx,
    });
  } catch (err) {
    console.error('Error creating transaction:', err);
    return res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
});

// Endpoint 5: Delete Transaction
app.delete('/api/transactions/:id', authMiddleware, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, error: 'Invalid transaction ID' });
    }

    const deleted = deleteTransaction(req.user.id, id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
    }

    return res.json({
      success: true,
      message: 'Transaction deleted successfully',
      id,
    });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
});

// Global 404 & error handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
