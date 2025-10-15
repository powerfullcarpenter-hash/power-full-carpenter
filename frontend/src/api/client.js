import axios from "axios";

// 🔹 Forzamos a mostrar qué URL está usando
const baseURL =
  import.meta.env.VITE_API_URL?.trim?.() ||
  "https://power-full-carpenter.onrender.com/api";

console.log("🌐 Usando API baseURL =>", baseURL);

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Incluir token si existe
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
