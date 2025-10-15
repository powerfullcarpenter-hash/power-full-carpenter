// /frontend/src/components/kanban/TaskCard.jsx
import { useEffect, useMemo, useState } from "react";
import { startTask, updateTaskStatus } from "../../api/kanban";
import RegistroConsumoModal from "./RegistroConsumoModal";
import TaskModal from "./TaskModal";

// 🔹 Formatea segundos a hh:mm:ss
function formatSeconds(sec) {
  sec = Number(sec) || 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
}

// 🔹 Badge de prioridad con colores
function PrioridadBadge({ prioridad }) {
  if (!prioridad) return null;
  let colorClass = "bg-gray-200 text-gray-700 border border-gray-300";
  if (prioridad.toLowerCase() === "alta")
    colorClass = "bg-red-100 text-red-700 border border-red-300";
  if (prioridad.toLowerCase() === "normal")
    colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-300";
  if (prioridad.toLowerCase() === "baja")
    colorClass = "bg-gray-100 text-gray-700 border border-gray-300";

  return (
    <span
      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}
    >
      {prioridad}
    </span>
  );
}

export default function TaskCard({ task, onMoveTask, onAction, showOperario, user }) {
  const {
    task_id,
    titulo,
    descripcion,
    pedido_id,
    nombre_cliente,
    operario_nombre,
    inicio,
    tiempo_acumulado,
  } = task;

  const [nowTick, setNowTick] = useState(Date.now());
  const [showConsumoModal, setShowConsumoModal] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsedSeconds = useMemo(() => {
    const base = Number(tiempo_acumulado) || 0;
    if (inicio) {
      const startedAt = new Date(inicio).getTime();
      const diff = Math.floor((Date.now() - startedAt) / 1000);
      return base + Math.max(0, diff);
    }
    return base;
  }, [tiempo_acumulado, inicio, nowTick]);

  const nextStatus = (estado) => {
    if (estado === "Por Hacer" || estado === "Pendiente") return "En Curso";
    if (estado === "En Curso" || estado === "En proceso") return "Terminado";
    return null;
  };

  const handleMove = async (e) => {
    e.stopPropagation();
    const next = nextStatus(task.estado);
    if (!next) return;
    try {
      if (onMoveTask) {
        await onMoveTask(task_id, next);
      } else {
        await updateTaskStatus(task_id, { estado: next });
        if (next === "En Curso") await startTask(task_id);
      }
      onAction?.();
    } catch (e) {
      console.error("Error moviendo tarea:", e);
      alert(e.response?.data?.error || e.message || "Error moviendo tarea");
    }
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData("taskId", task_id);
  };

  return (
    <>
      {/* 🔹 Tarjeta de Tarea */}
      <div
        className="relative bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[130px]"
        draggable={task.estado !== "Terminado"}
        onDragStart={handleDragStart}
        onClick={() => setShowModal(true)}
      >
        {/* 🔹 Prioridad */}
        <PrioridadBadge prioridad={task.prioridad} />

        {/* 🔹 Contenido */}
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-1 truncate">
            {titulo}
          </h3>

          <p className="text-xs text-gray-600 mb-1 line-clamp-2 sm:line-clamp-3">
            {descripcion || "Sin descripción"}
          </p>

          <p className="text-xs text-gray-500 mb-1">
            Pedido #{pedido_id} • Cliente: {nombre_cliente}
          </p>

          {task.fecha_compromiso && (
            <p className="text-xs text-blue-600 font-medium mb-1">
              📅 Compromiso:{" "}
              {new Date(task.fecha_compromiso).toLocaleDateString()}
            </p>
          )}

          {showOperario && operario_nombre && (
            <p className="text-xs font-semibold text-purple-600 mb-2 truncate">
              👷 {operario_nombre}
            </p>
          )}
        </div>

        {/* 🔹 Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
          <span className="text-[11px] text-gray-500">
            ⏱ {formatSeconds(elapsedSeconds)}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {task.estado !== "Terminado" && (
              <button
                onClick={handleMove}
                className="bg-blue-600 text-white px-2 py-1 text-[11px] rounded-md hover:bg-blue-700 active:bg-blue-800 transition w-full sm:w-auto"
              >
                → {nextStatus(task.estado)}
              </button>
            )}

            {/* 🔸 Botones exclusivos de operario */}
            {user?.role?.toLowerCase() === "operario" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowConsumoModal(true);
                  }}
                  className="bg-indigo-500 text-white px-2 py-1 text-[11px] rounded-md hover:bg-indigo-600 active:bg-indigo-700 transition w-full sm:w-auto"
                >
                  ➕ Consumo
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="bg-orange-500 text-white px-2 py-1 text-[11px] rounded-md hover:bg-orange-600 active:bg-orange-700 transition w-full sm:w-auto"
                >
                  ⚠️ Incidencia
                </button>
              </>
            )}
          </div>
        </div>

        {/* 🔹 Modal de Registro de Consumo */}
        <RegistroConsumoModal
          visible={showConsumoModal}
          task={task}
          onClose={() => setShowConsumoModal(false)}
          onSuccess={() => onAction?.()}
        />
      </div>

      {/* 🔹 Modal General */}
      <TaskModal
        visible={showModal}
        task={task}
        onClose={() => setShowModal(false)}
        onAction={onAction}
      />
    </>
  );
}
