import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // 🆕 Estado global de carga

  // 🟢 Iniciar sesión
  const login = (data) => {
    const userData = {
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      role: data.role,
    };

    setUser(userData);
    setToken(data.token);

    localStorage.setItem(
      "auth",
      JSON.stringify({ user: userData, token: data.token })
    );
  };

  // 🔴 Cerrar sesión
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth");
  };

  // 🔄 Rehidratar sesión al cargar la app
  useEffect(() => {
    const loadAuth = () => {
      try {
        const storedAuth = localStorage.getItem("auth");
        if (storedAuth) {
          const { user, token } = JSON.parse(storedAuth);
          if (user && token) {
            setUser(user);
            setToken(token);
          }
        }
      } catch (err) {
        console.error("❌ Error al leer auth en localStorage:", err);
        localStorage.removeItem("auth");
      } finally {
        setLoading(false); // ✅ Marca carga completada
      }
    };

    loadAuth();

    // 🧩 Escucha cierre de sesión en otras pestañas
    const handleStorageChange = (e) => {
      if (e.key === "auth" && !e.newValue) {
        setUser(null);
        setToken(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AppContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
