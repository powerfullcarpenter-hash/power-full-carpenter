import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import { getTasks, updateTaskStatus, startTask, pauseTask } from "../../api/kanban";
import KanbanColumn from "./KanbanColumn";

export default function KanbanBoard({ onAddConsumption, onReportIncidencia }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterOperario, setFilterOperario] = useState("");
  const { user } = useAppContext();
  const navigate = useNavigate();

  // 🔹 Cargar tareas periódicamente
  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error("Error cargando tareas:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, []);

  // 🔹 Mover tareas entre columnas
  const moveTask = async (taskId, newStatus) => {
    try {
      const taskToMove = tasks.find((task) => task.task_id === taskId);
      if (!taskToMove) return;

      if (taskToMove.estado === "En Curso" && newStatus === "Por Hacer") return;
      if (taskToMove.estado === "Terminado") return;

      await updateTaskStatus(taskId, { estado: newStatus });

      if (newStatus === "En Curso") {
        await startTask(taskId);
      } else if (newStatus === "Por Hacer" && taskToMove.estado === "En Curso") {
        await pauseTask(taskId);
      }

      await fetchTasks();
    } catch (err) {
      console.error("Error moviendo tarea:", err);
    }
  };

  // 🔹 Eventos de interacción
  const handleTaskClick = (task) => {
    if (user?.role.toLowerCase() === "operario") {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleAddConsumption = () => {
    if (onAddConsumption) onAddConsumption(selectedTask);
    handleCloseModal();
  };

  const handleReportIncidencia = () => {
    if (onReportIncidencia) onReportIncidencia(selectedTask);
    handleCloseModal();
  };

  // 🔹 Modal interno de opciones rápidas
  const TaskModal = () => {
    if (!selectedTask) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-3 sm:px-0">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-6 animate-fade-in-down">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
            onClick={handleCloseModal}
          >
            ✕
          </button>

          <h2 className="text-lg sm:text-xl font-extrabold text-gray-800 mb-3">
            Opciones de Tarea
          </h2>
          <p className="mb-5 text-sm text-gray-600">
            Tarea seleccionada:{" "}
            <span className="font-medium text-gray-800">
              {selectedTask.title || selectedTask.titulo}
            </span>
          </p>

          <div className="flex flex-col gap-3">
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
              onClick={handleAddConsumption}
            >
              ➕ Registro Rápido de Consumo
            </button>
            <button
              className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 active:bg-red-800 transition shadow-sm"
              onClick={handleReportIncidencia}
            >
              ⚠️ Reportar Incidencia
            </button>
          </div>
        </div>
      </div>
    );
  };

  const columns = ["Por Hacer", "En Curso", "Terminado"];
  const operarios = [...new Set(tasks.map((t) => t.operario_nombre).filter(Boolean))];

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        {user?.role?.toLowerCase() === "supervisor" && (
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm w-full sm:w-auto"
          >
            ← Ir al Dashboard
          </button>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 text-center flex-1">
          📌 Tablero Kanban
        </h1>

        <div className="hidden sm:block w-28" /> {/* equilibrio visual */}
      </div>

      {/* 🔹 Filtro de Operarios (solo supervisores) */}
      {user?.role?.toLowerCase() === "supervisor" && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Filtrar por Operario
          </label>
          <select
            value={filterOperario}
            onChange={(e) => setFilterOperario(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          >
            <option value="">Todos los Operarios</option>
            {operarios.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 🔹 Tablero Kanban */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {columns.map((col) => (
          <KanbanColumn
            key={col}
            title={col}
            tasks={tasks.filter(
              (t) =>
                t.estado === col &&
                (filterOperario ? t.operario_nombre === filterOperario : true)
            )}
            onMoveTask={moveTask}
            onAction={fetchTasks}
            showOperario={user?.role.toLowerCase() === "supervisor"}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>

      {/* 🔹 Modal de opciones rápidas */}
      {isModalOpen && <TaskModal />}
    </div>
  );
}
