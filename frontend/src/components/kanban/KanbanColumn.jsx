// /frontend/src/components/kanban/KanbanColumn.jsx
import TaskCard from "./TaskCard";

export default function KanbanColumn({ title, tasks, onMoveTask, onAction, showOperario }) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) onMoveTask(taskId, title);
  };

  // 🎨 Colores por columna
  const columnColors = {
    "Por Hacer": "bg-gray-100 text-gray-700 border-gray-300",
    "En Curso": "bg-blue-100 text-blue-700 border-blue-300",
    Terminado: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <div
      className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 min-h-[300px] transition hover:shadow-md w-full sm:w-80 mx-auto"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 🔹 Encabezado */}
      <div
        className={`px-3 py-2 rounded-lg font-semibold text-sm border ${
          columnColors[title] ||
          "bg-gray-100 text-gray-700 border-gray-300"
        } mb-4 text-center whitespace-nowrap overflow-hidden text-ellipsis`}
      >
        {title}{" "}
        <span className="ml-1 text-xs font-normal text-gray-500">
          ({tasks.length})
        </span>
      </div>

      {/* 🔹 Contenedor de tareas */}
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[70vh] pr-1 sm:pr-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {tasks.map((t) => (
          <TaskCard
            key={t.task_id}
            task={t}
            onMoveTask={onMoveTask}
            onAction={onAction}
            showOperario={showOperario}
          />
        ))}
        {tasks.length === 0 && (
          <p className="text-gray-400 italic text-center py-6">Sin tareas</p>
        )}
      </div>
    </div>
  );
}
