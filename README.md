# Personal Finance Dashboard 💰

A minimal, full-stack personal finance web application built for a 45-minute workshop. It features passwordless authentication via WhatsApp & SMS OTP using the **Minimoth API**, real-time budget tracking, and cash-flow transaction management.

---

## ⚡ Architectural Constraints Met

- **Frontend Pages (Max 3):**
  1. `AuthPage`: Phone input, Minimoth OTP request, code verification & session creation.
  2. `DashboardPage`: Financial overview cards (Net Balance, Income, Expenses, Savings Rate), monthly budget progress bars, quick transaction entry, and recent 5 transactions.
  3. `TransactionsPage`: Complete transaction history table, category expense breakdown, filters by type & category, search, and delete functionality.
- **Backend API Endpoints (Max 5):**
  1. `POST /api/auth/send-otp` — Initiates phone verification via Minimoth API (`POST https://api.minimoth.dev/v1/otp/send`).
  2. `POST /api/auth/verify-otp` — Validates OTP code (`POST https://api.minimoth.dev/v1/otp/verify`), creates/finds user, and returns JWT.
  3. `GET /api/dashboard` — Returns user profile, aggregate metrics (balance, income, expenses, savings rate), budget limits with actual spent, and transaction records.
  4. `POST /api/transactions` — Creates an income or expense transaction with input validation.
  5. `DELETE /api/transactions/:id` — Deletes an authorized user transaction.
- **Database Entities / Models (Max 3):**
  1. `User` (`id`, `phone`, `name`, `created_at`)
  2. `Transaction` (`id`, `user_id`, `title`, `amount`, `type`, `category`, `date`, `created_at`)
  3. `Budget` (`id`, `user_id`, `category`, `monthly_limit`, `created_at`)

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Vanilla CSS (Custom modern dark slate & emerald palette)
- **Backend:** Node.js, Express, `node:sqlite` (zero-dependency built-in SQLite engine)
- **Authentication:** [Minimoth API](https://minimoth.dev) for WhatsApp & SMS OTP delivery + JWT sessions

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20+ (Node v22+ or v24 recommended for native SQLite)
- **npm** v9+

---

### 2. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Ensure your `.env` contains:
   ```env
   PORT=5000
   JWT_SECRET=super_secret_finance_jwt_token_2025
   MINIMOTH_API_KEY=mm_live_b97c0d0aed35416a8b9b545877f65d8c707725072ec498b841b1dfe7ce32cc11c720dcfbc827cd488fffec8f234708b4
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   Backend will run on `http://localhost:5000`.

---

### 3. Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Default content:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 📱 How Authentication Works with Minimoth

1. **Enter Phone Number:** Input your phone number in E.164 format (e.g. `+91 9876543210`).
2. **Receive OTP:** Minimoth automatically delivers the 6-digit code via WhatsApp (with automatic SMS fallback).
3. **Verify:** Submit the 6-digit code to securely log in and access your personal dashboard.

---

## 📂 Project Structure

```
Personal-Finance-Dashboard/
├── backend/
│   ├── .env.example
│   ├── db.js             # SQLite Database & 3 Models (users, transactions, budgets)
│   ├── server.js         # Express server with exactly 5 endpoints
│   └── package.json
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── src/
│   │   ├── api.js        # Backend API service
│   │   ├── App.jsx       # Main layout & router
│   │   ├── App.css       # Custom modern dark-mode styling
│   │   ├── index.css     # CSS variables & typography
│   │   └── pages/
│   │       ├── AuthPage.jsx          # Page 1: Minimoth OTP Login/Register
│   │       ├── DashboardPage.jsx     # Page 2: Overview & Budgets
│   │       └── TransactionsPage.jsx  # Page 3: Transaction Table & Filters
│   └── package.json
├── .gitignore
└── README.md
```

---

## 📜 License
MIT License.
