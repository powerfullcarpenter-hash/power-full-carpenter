import { useAppContext } from "../../contexts/AppContext";
import useAuthGuard from "../../hooks/useAuthGuard";

export default function PrivateRoute({ children, allowedRoles }) {
  const { loading } = useAppContext();
  const user = useAuthGuard(allowedRoles);

  // 🌀 Mientras se verifica la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // 🚫 Si no hay usuario (redirección ocurre en useAuthGuard)
  if (!user) return null;

  // ✅ Si todo está bien, renderiza el contenido protegido
  return children;
}
