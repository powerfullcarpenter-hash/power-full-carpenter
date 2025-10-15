import { useState } from "react";
import { login as apiLogin } from "../../api/auth";
import { useAppContext } from "../../contexts/AppContext";
import useRedirectByRole from "../../hooks/useRedirectByRole";
import logoCarpinteria from "../../images/logo-carpinteria.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAppContext();
  const redirectByRole = useRedirectByRole();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password) {
      setError("Completa ambos campos");
      setLoading(false);
      return;
    }

    try {
      const data = await apiLogin({ email, password });
      login(data);
      redirectByRole(data.role);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Error al iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:py-0">
      {/* 🔹 Título principal */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center mb-6 sm:mb-8 tracking-tight">
        Bienvenido a{" "}
        <span className="text-blue-600">Power Full Carpenter</span>
      </h1>

      {/* 🔹 Caja blanca */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm sm:max-w-md flex flex-col items-center border border-gray-100">
        {/* Logo */}
        <img
          src={logoCarpinteria}
          alt="Logo Power Full Carpenter"
          className="h-40 sm:h-56 w-auto mb-5 sm:mb-6 drop-shadow-sm"
        />

        {/* Subtítulo */}
        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">
          Inicia sesión para comenzar tu jornada de trabajo
        </p>

        {/* Mensaje de error */}
        {error && (
          <p className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded mb-4 w-full text-center">
            {error}
          </p>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="grid gap-4 w-full">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 px-3 py-2 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm sm:text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
            } text-white py-2.5 rounded-lg font-semibold transition-colors shadow-sm mt-2`}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>

      {/* Pie de página (solo móvil) */}
      <p className="text-xs text-gray-400 mt-6 sm:mt-8 text-center">
        © {new Date().getFullYear()} Power Full Carpenter — Todos los derechos reservados
      </p>
    </div>
  );
}

