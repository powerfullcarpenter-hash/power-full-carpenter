import { useNavigate } from "react-router-dom";

export default function DashboardHome() {
  const navigate = useNavigate();

  const modules = [
    { label: "Pedidos", path: "/pedidos", icon: "📦" },
    { label: "Inventario", path: "/inventario", icon: "🗂️" },
    { label: "Kanban Global", path: "/kanban", icon: "📋" },
    { label: "Reportes", path: "/reportes", icon: "📑" },
    { label: "Parámetros", path: "/parametros", icon: "⚙️" },
    { label: "Incidencias", path: "/incidencias", icon: "⚠️" },
    { label: "Clientes", path: "/clientes", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col items-center">
      {/* 🔹 Encabezado */}
      <header className="text-center mt-16 sm:mt-24 mb-10 sm:mb-12 px-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          Bienvenido a{" "}
          <span className="text-blue-600">Power Full Carpenter</span> 🛠️
        </h1>
        <p className="text-sm sm:text-md text-gray-600 max-w-md mx-auto px-2">
          Selecciona un módulo para comenzar tu jornada de trabajo.
        </p>
      </header>

      {/* 🔹 Módulos */}
      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 w-full max-w-5xl px-4 sm:px-6 pb-16">
        {modules.map((m) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            className="relative bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 p-6 sm:p-8 flex flex-col items-center justify-center text-center group"
          >
            {/* Ícono */}
            <div className="text-4xl sm:text-5xl mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110">
              <span className="inline-block transform group-hover:rotate-3">
                {m.icon}
              </span>
            </div>

            {/* Etiqueta */}
            <span className="text-base sm:text-lg font-semibold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
              {m.label}
            </span>

            {/* Halo en hover */}
            <span className="absolute inset-0 rounded-2xl bg-blue-50 opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none"></span>
          </button>
        ))}
      </main>
    </div>
  );
}
