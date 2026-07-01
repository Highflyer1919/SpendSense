import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMe, getTransactions, getCategories,
  createTransaction, deleteTransaction,
  getBudgets, createBudget, getInsights
} from "../api";
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#6366f1","#22d3ee","#f59e0b","#10b981","#f43f5e","#a78bfa","#fb923c","#34d399","#60a5fa","#e879f9"];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [insights, setInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [form, setForm] = useState({
    category_id: "", amount: "", description: "",
    transaction_type: "expense", date: new Date().toISOString().split("T")[0]
  });
  const [budgetForm, setBudgetForm] = useState({
    category_id: "", monthly_limit: "",
    month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [meRes, txRes, catRes, budRes] = await Promise.all([
        getMe(), getTransactions(), getCategories(), getBudgets()
      ]);
      setUser(meRes.data);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      setBudgets(budRes.data);
    } catch { navigate("/login"); }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    await createTransaction({ ...form, category_id: parseInt(form.category_id), amount: parseFloat(form.amount) });
    setForm({ category_id: "", amount: "", description: "", transaction_type: "expense", date: new Date().toISOString().split("T")[0] });
    const res = await getTransactions();
    setTransactions(res.data);
  };

  const handleDeleteTransaction = async (id) => {
    await deleteTransaction(id);
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    await createBudget({ ...budgetForm, category_id: parseInt(budgetForm.category_id), monthly_limit: parseFloat(budgetForm.monthly_limit) });
    const res = await getBudgets();
    setBudgets(res.data);
  };

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const res = await getInsights();
    setInsights(res.data.insights);
    setLoadingInsights(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalIncome = transactions.filter(t => t.transaction_type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.transaction_type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const pieData = categories.map(cat => ({
    name: cat.name,
    value: transactions.filter(t => t.category.id === cat.id && t.transaction_type === "expense").reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0);

  const barData = categories.map(cat => ({
    name: cat.name.split(" ")[0],
    spent: transactions.filter(t => t.category.id === cat.id && t.transaction_type === "expense").reduce((s, t) => s + t.amount, 0),
    budget: budgets.find(b => b.category.id === cat.id)?.monthly_limit || 0
  })).filter(d => d.spent > 0 || d.budget > 0);

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <h2 style={s.logo}>💸 SpendSense</h2>
        <p style={s.userName}>{user?.full_name}</p>
        {["overview","transactions","budgets","insights"].map(tab => (
          <button key={tab} style={{ ...s.tabBtn, ...(activeTab === tab ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <button style={s.logoutBtn} onClick={handleLogout}>Log Out</button>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div>
            <h2 style={s.heading}>Overview</h2>
            <div style={s.cards}>
              <div style={{ ...s.card, borderTop: "3px solid #10b981" }}>
                <p style={s.cardLabel}>Total Income</p>
                <p style={s.cardValue}>₹{totalIncome.toFixed(2)}</p>
              </div>
              <div style={{ ...s.card, borderTop: "3px solid #f43f5e" }}>
                <p style={s.cardLabel}>Total Expenses</p>
                <p style={s.cardValue}>₹{totalExpense.toFixed(2)}</p>
              </div>
              <div style={{ ...s.card, borderTop: "3px solid #6366f1" }}>
                <p style={s.cardLabel}>Balance</p>
                <p style={{ ...s.cardValue, color: balance >= 0 ? "#10b981" : "#f43f5e" }}>₹{balance.toFixed(2)}</p>
              </div>
            </div>
            <div style={s.charts}>
              {pieData.length > 0 && (
                <div style={s.chartBox}>
                  <h3 style={s.chartTitle}>Spending by Category</h3>
                  <PieChart width={300} height={250}>
                    <Pie data={pieData} cx={150} cy={110} outerRadius={90} dataKey="value" label={({ name }) => name}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                  </PieChart>
                </div>
              )}
              {barData.length > 0 && (
                <div style={s.chartBox}>
                  <h3 style={s.chartTitle}>Budget vs Spent</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="budget" fill="#6366f1" name="Budget" />
                      <Bar dataKey="spent" fill="#f43f5e" name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div>
            <h2 style={s.heading}>Transactions</h2>
            <form onSubmit={handleAddTransaction} style={s.form}>
              <select style={s.input} value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <select style={s.input} value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input style={s.input} type="number" placeholder="Amount (₹)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              <input style={s.input} type="text" placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <input style={s.input} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              <button style={s.btn} type="submit">Add Transaction</button>
            </form>
            <div style={s.list}>
              {transactions.map(t => (
                <div key={t.id} style={s.txRow}>
                  <span style={s.txIcon}>{t.category.icon}</span>
                  <div style={s.txInfo}>
                    <p style={s.txDesc}>{t.description || t.category.name}</p>
                    <p style={s.txMeta}>{t.category.name} • {t.date}</p>
                  </div>
                  <span style={{ ...s.txAmount, color: t.transaction_type === "income" ? "#10b981" : "#f43f5e" }}>
                    {t.transaction_type === "income" ? "+" : "-"}₹{t.amount.toFixed(2)}
                  </span>
                  <button style={s.delBtn} onClick={() => handleDeleteTransaction(t.id)}>✕</button>
                </div>
              ))}
              {transactions.length === 0 && <p style={s.empty}>No transactions yet. Add one above.</p>}
            </div>
          </div>
        )}

        {/* BUDGETS */}
        {activeTab === "budgets" && (
          <div>
            <h2 style={s.heading}>Budgets</h2>
            <form onSubmit={handleAddBudget} style={s.form}>
              <select style={s.input} value={budgetForm.category_id} onChange={e => setBudgetForm({ ...budgetForm, category_id: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <input style={s.input} type="number" placeholder="Monthly Limit (₹)" value={budgetForm.monthly_limit} onChange={e => setBudgetForm({ ...budgetForm, monthly_limit: e.target.value })} required />
              <select style={s.input} value={budgetForm.month} onChange={e => setBudgetForm({ ...budgetForm, month: parseInt(e.target.value) })}>
                {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <input style={s.input} type="number" placeholder="Year" value={budgetForm.year} onChange={e => setBudgetForm({ ...budgetForm, year: parseInt(e.target.value) })} required />
              <button style={s.btn} type="submit">Set Budget</button>
            </form>
            <div style={s.list}>
              {budgets.map(b => (
                <div key={b.id} style={s.txRow}>
                  <span style={s.txIcon}>{b.category.icon}</span>
                  <div style={s.txInfo}>
                    <p style={s.txDesc}>{b.category.name}</p>
                    <p style={s.txMeta}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][b.month - 1]} {b.year}</p>
                  </div>
                  <span style={s.txAmount}>₹{b.monthly_limit.toFixed(2)}</span>
                </div>
              ))}
              {budgets.length === 0 && <p style={s.empty}>No budgets set yet.</p>}
            </div>
          </div>
        )}

        {/* INSIGHTS */}
        {activeTab === "insights" && (
          <div>
            <h2 style={s.heading}>AI Insights</h2>
            <p style={s.subtext}>Get personalised spending analysis powered by AI.</p>
            <button style={s.btn} onClick={handleGetInsights} disabled={loadingInsights}>
              {loadingInsights ? "Analysing..." : "✨ Generate Insights"}
            </button>
            {insights && (
              <div style={s.insightBox}>
                {insights.split("\n").map((line, i) => (
                  <p key={i} style={{ margin: "0.4rem 0", color: "#e2e8f0" }}>{line}</p>
                ))}
              </div>
            )}
            {!insights && !loadingInsights && (
              <p style={s.empty}>Add some transactions first, then click Generate Insights.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  app: { display: "flex", minHeight: "100vh", background: "#0f172a", color: "#f8fafc" },
  sidebar: { width: "220px", background: "#1e293b", padding: "2rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 },
  logo: { color: "#f8fafc", marginBottom: "0.25rem" },
  userName: { color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" },
  tabBtn: { background: "none", border: "none", color: "#94a3b8", textAlign: "left", padding: "0.6rem 0.75rem", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem", textTransform: "capitalize" },
  tabActive: { background: "#334155", color: "#f8fafc" },
  logoutBtn: { marginTop: "auto", background: "none", border: "1px solid #334155", color: "#94a3b8", padding: "0.6rem", borderRadius: "8px", cursor: "pointer" },
  main: { flex: 1, padding: "2rem 2.5rem", overflowY: "auto" },
  heading: { fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" },
  cards: { display: "flex", gap: "1.5rem", marginBottom: "2rem", flexWrap: "wrap" },
  card: { background: "#1e293b", padding: "1.5rem", borderRadius: "12px", flex: 1, minWidth: "160px" },
  cardLabel: { color: "#94a3b8", fontSize: "0.85rem", marginBottom: "0.5rem" },
  cardValue: { fontSize: "1.75rem", fontWeight: "700" },
  charts: { display: "flex", gap: "2rem", flexWrap: "wrap" },
  chartBox: { background: "#1e293b", padding: "1.5rem", borderRadius: "12px", flex: 1, minWidth: "300px" },
  chartTitle: { color: "#94a3b8", marginBottom: "1rem", fontSize: "0.95rem" },
  form: { background: "#1e293b", padding: "1.5rem", borderRadius: "12px", display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.5rem" },
  input: { padding: "0.65rem 0.9rem", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "#f8fafc", fontSize: "0.9rem", flex: "1 1 180px" },
  btn: { padding: "0.65rem 1.5rem", borderRadius: "8px", border: "none", background: "#6366f1", color: "#fff", fontWeight: "600", cursor: "pointer", fontSize: "0.95rem" },
  list: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  txRow: { background: "#1e293b", padding: "1rem 1.25rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "1rem" },
  txIcon: { fontSize: "1.5rem" },
  txInfo: { flex: 1 },
  txDesc: { fontWeight: "500", marginBottom: "0.2rem" },
  txMeta: { color: "#94a3b8", fontSize: "0.8rem" },
  txAmount: { fontWeight: "700", fontSize: "1.1rem" },
  delBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1rem" },
  empty: { color: "#64748b", textAlign: "center", padding: "2rem" },
  subtext: { color: "#94a3b8", marginBottom: "1.5rem" },
  insightBox: { background: "#1e293b", padding: "1.5rem", borderRadius: "12px", marginTop: "1.5rem", lineHeight: "1.8" },
};