import { useAppContext } from "../../contexts/AppContext";

export default function Navbar() {
  const { user, logout } = useAppContext();

  return (
    <>
      {/* 🔹 Barra fija superior */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm z-50 px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* 🔹 Logo o título */}
        <div className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-extrabold text-gray-800 tracking-tight select-none flex items-center gap-1">
            🪵 <span className="hidden sm:inline">Power Full Carpenter</span>
          </span>
        </div>

        {/* 🔹 Usuario y botón de cerrar sesión */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <span className="truncate max-w-[100px] sm:max-w-[160px] text-sm font-medium text-gray-700">
                👤 {user.name || user.username}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 sm:px-4 py-1.5 rounded-lg hover:bg-red-600 active:bg-red-700 text-sm font-medium transition shadow-sm"
          >
            🔒 Cerrar sesión
          </button>
        </div>
      </nav>

      {/* 🔹 Espaciado para evitar solapamiento con el contenido */}
      <div className="h-14 sm:h-16"></div>
    </>
  );
}
