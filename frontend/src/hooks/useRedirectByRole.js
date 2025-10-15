import { useNavigate } from "react-router-dom";

export default function useRedirectByRole() {
  const navigate = useNavigate();

  const redirectByRole = (role) => {
    if (!role || typeof role !== "string") {
      console.warn("⚠️ Rol no definido o inválido. Redirigiendo al login...");
      navigate("/login", { replace: true });
      return;
    }

    // 🔹 Normalizamos a minúsculas
    const r = role.trim().toLowerCase();

    // 🔹 Tabla de rutas por rol (fácil de extender)
    const roleRoutes = {
      supervisor: "/dashboard",
      inventario: "/inventario",
      operario: "/kanban",
    };

    // 🔹 Destino correspondiente o fallback
    const target = roleRoutes[r] || "/login";

    console.info(`✅ Redirigiendo a: ${target} (rol: ${r})`);
    navigate(target, { replace: true });
  };

  return redirectByRole;
}
