import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💸 SpendSense</h1>
        <p style={styles.subtitle}>Create your account</p>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            type="text"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button style={styles.button} type="submit">
            Create Account
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
  },
  card: {
    background: "#1e293b",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
  },
  title: { color: "#f8fafc", textAlign: "center", marginBottom: "0.25rem" },
  subtitle: { color: "#94a3b8", textAlign: "center", marginBottom: "1.5rem" },
  error: { color: "#f87171", marginBottom: "1rem", textAlign: "center" },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "#f8fafc",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    background: "#6366f1",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  link: { color: "#94a3b8", textAlign: "center", marginTop: "1.5rem" },
};