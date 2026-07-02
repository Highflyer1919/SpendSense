import axios from "axios";
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000" });
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export const register = (data) => API.post("/auth/register", data);
export const login = (data) =>
  API.post("/auth/login", new URLSearchParams(data));
export const getMe = () => API.get("/auth/me");
export const getCategories = () => API.get("/categories");
export const getTransactions = () => API.get("/transactions");
export const createTransaction = (data) => API.post("/transactions", data);
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
export const getBudgets = () => API.get("/budgets");
export const createBudget = (data) => API.post("/budgets", data);
export const getInsights = () => API.get("/insights");
