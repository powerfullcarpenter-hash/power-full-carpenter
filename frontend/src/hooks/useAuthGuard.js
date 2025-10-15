import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import useRedirectByRole from "./useRedirectByRole";

export default function useAuthGuard(allowedRoles = []) {
  const { user, loading } = useAppContext();
  const navigate = useNavigate();
  const redirectByRole = useRedirectByRole();

  useEffect(() => {
    // 🧩 Esperar a que se cargue el estado de autenticación
    if (loading) return;

    // 🚫 Si no hay usuario → redirigir al login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // 🧱 Normalizar roles (en caso de diferencias de mayúsculas)
    const normalizedUserRole = user.role?.toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    // ⚙️ Verificar acceso
    if (allowedRoles.length > 0 && !normalizedAllowed.includes(normalizedUserRole)) {
      console.warn(`🚫 Acceso denegado: ${user.role}`);
      redirectByRole(user.role);
    }
  }, [user, loading, navigate, allowedRoles, redirectByRole]);

  return user;
}
