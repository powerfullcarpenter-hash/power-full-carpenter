import { useEffect, useState, useMemo } from "react";
import { startTask, pauseTask, finishTask, updateTaskStatus } from "../../api/kanban";
import { registrarConsumoRapido, getInsumos, getHistorial } from "../../api/inventory";
import { reportarIncidencia } from "../../api/incidencias";
import { getMotivos } from "../../api/parametros";
import { format } from "date-fns";

export default function TaskModal({ visible, task, onClose, onAction }) {
  const [nowTick, setNowTick] = useState(Date.now());
  const [insumos, setInsumos] = useState([]);
  const [insumoId, setInsumoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivos, setMotivos] = useState([]);
  const [motivo, setMotivo] = useState("");
  const [tipo, setTipo] = useState("faltante");
  const [urgencia, setUrgencia] = useState("media");
  const [descripcion, setDescripcion] = useState("");
  const [historial, setHistorial] = useState([]);

  // 💡 NUEVO: Variable para verificar si la tarea ha finalizado.
  const isFinished = task?.estado === "Terminado";

  useEffect(() => {
    if (visible) {
      getInsumos().then(setInsumos);

      getMotivos()
        .then((data) => {
          if (Array.isArray(data) && data.length) setMotivos(data);
          else
            setMotivos([
              { parametro_id: 1, valor: "Producción" },
              { parametro_id: 2, valor: "Error de corte" },
              { parametro_id: 3, valor: "Defecto de material" },
              { parametro_id: 4, valor: "Pérdida en transporte" },
            ]);
        })
        .catch((e) => console.error("Error cargando motivos:", e));

      loadHistorial();
    }
  }, [visible, task]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadHistorial = async () => {
    try {
      const data = await getHistorial(task.task_id);

      const consumos = data.consumos.map(
        (c) =>
          `Consumo de ${c.cantidad} ${c.unidad_medida} de ${c.nombre} (Motivo: ${c.motivo}) - ${new Date(
            c.fecha_movimiento
          ).toLocaleString()}`
      );

      const incidencias = data.incidencias.map(
        (i) =>
          `Incidencia (${i.tipo}, ${i.urgencia}): ${i.descripcion} - ${new Date(
            i.fecha_reporte
          ).toLocaleString()}`
      );

      setHistorial([...consumos, ...incidencias]);
    } catch (err) {
      console.error("Error cargando historial", err);
    }
  };

  const elapsedSeconds = useMemo(() => {
    const base = Number(task.tiempo_acumulado) || 0;
    if (task.inicio) {
      const startedAt = new Date(task.inicio).getTime();
      const diff = Math.floor((Date.now() - startedAt) / 1000);
      return base + Math.max(0, diff);
    }
    return base;
  }, [task.tiempo_acumulado, task.inicio, nowTick]);

  const formatTime = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleStart = async () => {
    await startTask(task.task_id);
    await updateTaskStatus(task.task_id, { estado: "En Curso" });
    setHistorial((h) => [...h, `Tarea iniciada - ${new Date().toLocaleString()}`]);
    onAction?.();
    onClose();
  };

  const handlePause = async () => {
    await pauseTask(task.task_id);
    await updateTaskStatus(task.task_id, { estado: "Por Hacer" });
    setHistorial((h) => [...h, `Tarea pausada - ${new Date().toLocaleString()}`]);
    onAction?.();
    onClose();
  };

  const handleFinish = async () => {
    await finishTask(task.task_id);
    setHistorial((h) => [...h, `Tarea finalizada - ${new Date().toLocaleString()}`]);
    onAction?.();
    onClose();
  };

  const handleConsumo = async (e) => {
    e.preventDefault();
    // 💡 NUEVO: No permitir si la tarea está terminada
    if (isFinished) return; 

    if (!insumoId || !cantidad || Number(cantidad) <= 0 || !motivo) {
      alert("Debes seleccionar insumo, motivo y una cantidad válida.");
      return;
    }
    try {
      await registrarConsumoRapido({
        taskId: task.task_id,
        insumoId: Number(insumoId),
        cantidad: Number(cantidad),
        motivo: String(motivo),
      });
      setCantidad("");
      setInsumoId("");
      setMotivo("");
      await loadHistorial();
      onAction?.();
    } catch (err) {
      alert(err.response?.data?.error || "Error registrando consumo");
    }
  };

  const handleIncidencia = async (e) => {
    e.preventDefault();
    // 💡 NUEVO: No permitir si la tarea está terminada
    if (isFinished) return;

    if (!descripcion.trim()) {
      alert("Debes ingresar una descripción para la incidencia.");
      return;
    }
    try {
      await reportarIncidencia({
        taskId: task.task_id,
        tipo,
        urgencia,
        descripcion,
      });
      setDescripcion("");
      setTipo("faltante");
      setUrgencia("media");
      await loadHistorial();
      onAction?.();
    } catch (err) {
      alert(err.response?.data?.error || "Error reportando incidencia");
    }
  };

  if (!visible) return null;

  const getPrioridadBadge = (prioridad) => {
    if (!prioridad) return null;
    let colorClass = "bg-gray-200 text-gray-800";
    if (prioridad.toLowerCase() === "alta")
      colorClass = "bg-red-100 text-red-700 border border-red-300";
    if (prioridad.toLowerCase() === "normal")
      colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-300";
    if (prioridad.toLowerCase() === "baja")
      colorClass = "bg-gray-100 text-gray-700 border border-gray-300";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}
      >
        {prioridad}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-3 sm:px-6">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-down relative">
        {/* ... (código anterior sin cambios) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          ✕
        </button>

        {/* 🔹 Título */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4">
          {task.titulo}
        </h2>

        {/* 🔹 Info de tarea */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 mb-6">
          <p>
            <strong>Pedido:</strong> {task.nombre_cliente} (#{task.pedido_id})
          </p>
          <p>
            <strong>Área:</strong> {task.area}
          </p>
          <p className="flex items-center gap-2">
            <strong>Prioridad:</strong> {getPrioridadBadge(task.prioridad)}
          </p>
          <p>
            <strong>Responsable:</strong> {task.operario_nombre}
          </p>
          <p>
            <strong>Estado:</strong> {task.estado}
          </p>
          <p>
            <strong>Compromiso:</strong>{" "}
            {task.fecha_compromiso
              ? format(new Date(task.fecha_compromiso), "yyyy-MM-dd")
              : "-"}
          </p>
        </div>
        {/* 💡 NUEVO: Sección de Descripción del Pedido */}
        {task.descripcion && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-6 rounded-lg shadow-sm">
            <p className="font-bold text-blue-800 text-sm mb-1">
              📝 Descripción del Pedido:
            </p>
            <p className="text-sm text-blue-700 whitespace-pre-wrap">
              {task.descripcion}
            </p>
          </div>
        )}


        {/* 🔹 Cronómetro */}
        <div className="bg-gray-50 rounded-lg p-4 text-center mb-6 border">
          <p className="font-semibold text-gray-700">⏱ Tiempo de Tarea</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800">
            {formatTime(elapsedSeconds)}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {task.estado !== "Terminado" && !task.inicio && (
              <button
                onClick={handleStart}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition"
              >
                Iniciar
              </button>
            )}
            {task.estado !== "Terminado" && task.inicio && (
              <button
                onClick={handlePause}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 active:bg-yellow-700 transition"
              >
                Pausar
              </button>
            )}
            {task.estado !== "Terminado" && (
              <button
                onClick={handleFinish}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>

        {/* 🔹 Formularios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Consumo */}
          <form onSubmit={handleConsumo} className={`border rounded-xl p-4 shadow-sm ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <h3 className="font-semibold text-gray-800 mb-3 text-center md:text-left">
              ➕ Registro Rápido de Consumo
            </h3>
            <select
              value={insumoId}
              onChange={(e) => setInsumoId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished} 
            >
              <option value="">Selecciona un insumo</option>
              {insumos.map((i) => (
                <option key={i.insumo_id} value={i.insumo_id}>
                  {i.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Cantidad"
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished} 
            />
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished}
            >
              <option value="">Seleccione un motivo</option>
              {motivos.map((m) => (
                <option key={m.parametro_id ?? m.valor} value={m.valor}>
                  {m.valor}
                </option>
              ))}
            </select>
            <button
              type="submit"
              // 💡 CAMBIO: Deshabilitar y ajustar clase si está terminado
              disabled={isFinished}
              className={`text-white px-4 py-2 rounded-lg w-full transition ${isFinished ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}`}
            >
              Registrar Consumo
            </button>
            {isFinished && <p className="text-red-500 text-xs mt-2 text-center">La tarea está terminada.</p>}
          </form>

          {/* Incidencia */}
          <form onSubmit={handleIncidencia} className={`border rounded-xl p-4 shadow-sm ${isFinished ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <h3 className="font-semibold text-gray-800 mb-3 text-center md:text-left">
              ⚠️ Reportar Incidencia
            </h3>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished}
            >
              <option value="faltante">Faltante</option>
              <option value="defecto">Defecto</option>
              <option value="equipo">Equipo</option>
            </select>
            <select
              value={urgencia}
              onChange={(e) => setUrgencia(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del problema..."
              className="w-full border rounded-lg px-3 py-2 mb-3 text-sm focus:ring-blue-500 min-h-[80px]"
              // 💡 CAMBIO: Deshabilitar si está terminado
              disabled={isFinished}
            />
            <button
              type="submit"
              // 💡 CAMBIO: Deshabilitar y ajustar clase si está terminado
              disabled={isFinished}
              className={`text-white px-4 py-2 rounded-lg w-full transition ${isFinished ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 active:bg-red-800'}`}
            >
              Reportar Incidencia
            </button>
            {isFinished && <p className="text-red-500 text-xs mt-2 text-center">La tarea está terminada.</p>}
          </form>
        </div>

        {/* 🔹 Historial */}
        {/* ... (código anterior sin cambios) */}
        <div className="bg-gray-50 p-4 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-3 text-center md:text-left">
            📜 Historial de Tarea
          </h3>
          {historial.length === 0 ? (
            <p className="text-sm text-gray-500 text-center">Sin registros todavía</p>
          ) : (
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              {historial.map((h, idx) => (
                <li key={idx}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}