const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'finance.db');
const db = new DatabaseSync(dbPath);

// Initialize SQLite Schema (3 Models: users, transactions, budgets)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// User queries
const getUserByPhone = (phone) => {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
};

const getUserById = (id) => {
  return db.prepare('SELECT id, phone, name, created_at FROM users WHERE id = ?').get(id);
};

const createUser = (phone, name = 'User') => {
  const insertUser = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)');
  const res = insertUser.run(phone, name);
  const userId = Number(res.lastInsertRowid);

  // Seed default budgets for new user
  const insertBudget = db.prepare('INSERT INTO budgets (user_id, category, monthly_limit) VALUES (?, ?, ?)');
  insertBudget.run(userId, 'Food & Dining', 500);
  insertBudget.run(userId, 'Shopping', 300);
  insertBudget.run(userId, 'Transportation', 200);
  insertBudget.run(userId, 'Bills & Utilities', 800);

  return getUserById(userId);
};

// Transaction queries
const getTransactionsByUserId = (userId) => {
  return db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC').all(userId);
};

const createTransaction = (userId, { title, amount, type, category, date }) => {
  const stmt = db.prepare(
    'INSERT INTO transactions (user_id, title, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const res = stmt.run(userId, title, amount, type, category, date);
  const id = Number(res.lastInsertRowid);
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
};

const deleteTransaction = (userId, id) => {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
  const res = stmt.run(id, userId);
  return res.changes > 0;
};

// Budget queries
const getBudgetsByUserId = (userId) => {
  return db.prepare('SELECT * FROM budgets WHERE user_id = ?').all(userId);
};

module.exports = {
  db,
  getUserByPhone,
  getUserById,
  createUser,
  getTransactionsByUserId,
  createTransaction,
  deleteTransaction,
  getBudgetsByUserId,
};
