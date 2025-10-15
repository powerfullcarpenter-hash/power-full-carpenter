import { useEffect, useState } from "react";
import { getTasks } from "../../api/kanban";

export default function UserDashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await getTasks({ asignado_a: user.user_id });
        setTasks(t);
      } catch (e) {
        console.error("Error cargando tareas:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 🔹 Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-2">
          Tareas Asignadas 📋
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Bienvenido, <span className="font-semibold">{user?.name}</span> — aquí están tus tareas actuales.
        </p>
      </div>

      {/* 🔹 Estado de carga */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm font-medium">Cargando tus tareas...</p>
          </div>
        </div>
      ) : tasks.length > 0 ? (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li
              key={t.task_id}
              className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:shadow-lg transition duration-200"
            >
              {/* Información de la tarea */}
              <div>
                <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
                  {t.nombre_tarea}
                </h3>
                <p className="text-gray-500 text-sm">
                  {t.descripcion || "Sin descripción disponible"}
                </p>
              </div>

              {/* Estado visual */}
              <span
                className={`mt-3 sm:mt-0 text-xs sm:text-sm px-3 py-1 rounded-full font-semibold self-start sm:self-center
                  ${
                    t.estado === "Completada"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : t.estado === "En progreso"
                      ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
              >
                {t.estado}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 italic text-base">
            No tienes tareas asignadas actualmente 🚀
          </p>
        </div>
      )}
    </div>
  );
}
