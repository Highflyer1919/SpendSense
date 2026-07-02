# SpendSense — Full Stack Expense Tracker with AI Insights

> A personal finance web application with JWT authentication, expense tracking, budget management, and AI-powered spending analysis.

---

## Overview

SpendSense is a full-stack personal finance application that helps users track income and expenses, set monthly budgets per category, and receive AI-generated spending insights powered by Groq. Built with a FastAPI backend, React frontend, and PostgreSQL database.

---

## Features

- **JWT Authentication** — Secure register and login with bcrypt password hashing and 24-hour tokens
- **Transaction Tracking** — Add, view, and delete income/expense entries with category icons
- **Budget Management** — Set monthly spending limits per category
- **Spending Visualizations** — Pie chart (spending by category) and bar chart (budget vs spent) via Recharts
- **AI Insights** — One-click personalised spending analysis and actionable recommendations via Groq LLM

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), React Router, Recharts, Axios |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Database | PostgreSQL (4 normalized tables) |
| Auth | JWT (python-jose), bcrypt |
| AI Insights | Groq API (openai/gpt-oss-20b) |
| Language | Python, JavaScript |

---

## Database Schema

```
users         → id, email, hashed_password, full_name, created_at
categories    → id, name, icon
transactions  → id, user_id, category_id, amount, description, type, date
budgets       → id, user_id, category_id, monthly_limit, month, year
```

---

## Project Structure

```
SpendSense/
├── backend/
│   ├── main.py          ← FastAPI routes (auth, transactions, budgets, insights)
│   ├── models.py        ← SQLAlchemy ORM models (4 tables)
│   ├── schemas.py       ← Pydantic request/response schemas
│   ├── auth.py          ← JWT creation, bcrypt hashing, token validation
│   ├── database.py      ← DB engine, session, Base
│   └── .env             ← DATABASE_URL, SECRET_KEY, GROQ_API_KEY (not committed)
└── frontend/
    └── src/
        ├── App.jsx          ← Routes and private route guard
        ├── api.js           ← Axios instance with JWT interceptor
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            └── Dashboard.jsx  ← Overview, Transactions, Budgets, Insights tabs
```

---

## Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose[cryptography] bcrypt python-dotenv pydantic[email] groq
```

Create a `.env` file:

```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/spendsense
SECRET_KEY=your_secret_key
GROQ_API_KEY=your_groq_api_key
```

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/auth/me` | Get current user |
| GET | `/categories` | List all categories |
| GET/POST | `/transactions` | Get or create transactions |
| DELETE | `/transactions/{id}` | Delete a transaction |
| GET/POST | `/budgets` | Get or create budgets |
| GET | `/insights` | Get AI spending insights |

---

## License

MIT License
