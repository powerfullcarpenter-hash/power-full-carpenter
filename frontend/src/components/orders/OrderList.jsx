import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getOrders, updateOrderStatus, updateOrder } from "../../api/orders";
import { getParametros } from "../../api/parametros";
import EditOrderModal from "./EditOrderModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* 🔹 Badge visual de prioridad */
function PrioridadBadge({ prioridad }) {
  if (!prioridad) return null;
  let colorClass = "bg-gray-200 text-gray-700 border border-gray-300";
  if (prioridad.toLowerCase() === "alta")
    colorClass = "bg-red-100 text-red-700 border border-red-300";
  if (["media", "normal"].includes(prioridad.toLowerCase()))
    colorClass = "bg-yellow-100 text-yellow-700 border border-yellow-300";
  if (prioridad.toLowerCase() === "baja")
    colorClass = "bg-green-100 text-green-700 border border-green-300";

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorClass}`}
    >
      {prioridad}
    </span>
  );
}

export default function OrderList({ refresh }) {
  const [orders, setOrders] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;
  const [editingOrder, setEditingOrder] = useState(null);

  const [estado, setEstado] = useState("Todos");
  const [area, setArea] = useState("Todos");
  const [prioridad, setPrioridad] = useState("Todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [orden, setOrden] = useState("");
  const [paramAreas, setParamAreas] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const clienteIdFiltro = searchParams.get("cliente_id");

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error("Error al obtener pedidos:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    (async () => {
      try {
        const areas = await getParametros("area");
        setParamAreas(areas);
      } catch (err) {
        console.error("Error cargando áreas dinámicas:", err);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    let data = [...orders];

    if (clienteIdFiltro) {
      data = data.filter((o) => String(o.cliente_id) === clienteIdFiltro);
    }

    if (estado !== "Todos") data = data.filter((o) => o.estado === estado);
    if (area !== "Todos") data = data.filter((o) => o.area === area);
    if (prioridad !== "Todos")
      data = data.filter((o) => o.prioridad === prioridad);
    if (desde)
      data = data.filter((o) =>
        o.fecha_compromiso
          ? new Date(o.fecha_compromiso) >= new Date(desde)
          : true
      );
    if (hasta)
      data = data.filter((o) =>
        o.fecha_compromiso
          ? new Date(o.fecha_compromiso) <= new Date(hasta)
          : true
      );

    if (orden === "fecha_compromiso") {
      data.sort((a, b) => {
        const dateA = a.fecha_compromiso
          ? new Date(a.fecha_compromiso)
          : new Date(0);
        const dateB = b.fecha_compromiso
          ? new Date(b.fecha_compromiso)
          : new Date(0);
        return dateA - dateB;
      });
    } else if (orden === "prioridad") {
      const orderPriority = { Alta: 1, Normal: 2, Media: 2, Baja: 3 };
      data.sort(
        (a, b) =>
          (orderPriority[a.prioridad] || 99) -
          (orderPriority[b.prioridad] || 99)
      );
    } else {
      data.sort((a, b) => b.pedido_id - a.pedido_id);
    }

    setFiltered(data);
  }, [orders, estado, area, prioridad, desde, hasta, orden, clienteIdFiltro]);

  const handleStatusChange = async (pedidoId, nuevoEstado) => {
    try {
      const updated = await updateOrderStatus(pedidoId, nuevoEstado);
      if (updated) {
        setOrders((prev) =>
          prev.map((o) =>
            o.pedido_id === pedidoId
              ? { ...o, estado: nuevoEstado, fecha_cierre: new Date() }
              : o
          )
        );
      }
    } catch (err) {
      console.error("Error al actualizar pedido:", err);
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  const handleEdit = (order) => setEditingOrder(order);

  const handleSave = async (updatedOrder) => {
    try {
      await updateOrder(updatedOrder.pedido_id, updatedOrder);
      fetchOrders();
      setEditingOrder(null);
    } catch (err) {
      console.error("Error al editar pedido:", err);
    }
  };

  const limpiarFiltroCliente = () => {
    searchParams.delete("cliente_id");
    setSearchParams(searchParams);
    navigate("/pedidos");
  };

  const exportPDF = () => {
    if (!filtered.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Lista de Pedidos", 14, 16);

    autoTable(doc, {
      startY: 22,
      head: [
        [
          "ID",
          "Cliente",
          "Descripción",
          "Estado",
          "Prioridad",
          "Área",
          "Fecha Compromiso",
          "Tarea",
          "Operario",
        ],
      ],
      body: filtered.map((o) => [
        o.pedido_id,
        o.nombre_cliente,
        o.descripcion || "—",
        o.estado,
        o.prioridad || "—",
        o.area || "—",
        o.fecha_compromiso
          ? new Date(o.fecha_compromiso).toLocaleDateString("es-ES")
          : "—",
        o.tarea_titulo || "—",
        o.operario_nombre || "No asignado",
      ]),
      styles: { fontSize: 8 },
    });

    doc.save("pedidos.pdf");
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
        📦 Lista de Pedidos
      </h2>

      {/* 🚀 Filtro activo (cliente específico) */}
      {clienteIdFiltro && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            📌 Filtrando pedidos del cliente <b>#{clienteIdFiltro}</b>{" "}
            {filtered.length > 0 && (
              <span className="ml-1">
                (<b>{filtered[0].nombre_cliente}</b>)
              </span>
            )}
          </div>
          <button
            onClick={limpiarFiltroCliente}
            className="text-red-600 hover:underline font-medium"
          >
            ❌ Limpiar filtro
          </button>
        </div>
      )}

      {/* 🎛️ Controles de Filtros */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="En Proceso">En Proceso</option>
              <option value="Terminado">Terminado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Área
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas</option>
              {paramAreas.map((a) => (
                <option key={a.parametro_id} value={a.valor}>
                  {a.valor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Normal">Normal</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ordenar por
            </label>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Por defecto</option>
              <option value="fecha_compromiso">Fecha compromiso</option>
              <option value="prioridad">Prioridad</option>
            </select>
          </div>
        </div>

        {/* Rango de fechas */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Desde
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={exportPDF}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              disabled={!filtered.length}
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* 🧾 Tabla de pedidos */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Cliente</th>
              <th className="p-2">Descripción</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Prioridad</th>
              <th className="p-2">Área</th>
              <th className="p-2">Fecha</th>
              <th className="p-2">Tarea</th>
              <th className="p-2">Operario</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered
              .slice(
                (paginaActual - 1) * itemsPorPagina,
                paginaActual * itemsPorPagina
              )
              .map((o) => (
                <tr
                  key={o.pedido_id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2">{o.pedido_id}</td>
                  <td className="p-2">{o.nombre_cliente}</td>
                  <td className="p-2">{o.descripcion || "—"}</td>
                  <td className="p-2">{o.estado}</td>
                  <td className="p-2">
                    <PrioridadBadge prioridad={o.prioridad} />
                  </td>
                  <td className="p-2">{o.area || "—"}</td>
                  <td className="p-2">
                    {o.fecha_compromiso
                      ? new Date(o.fecha_compromiso).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-2">{o.tarea_titulo || "—"}</td>
                  <td className="p-2">
                    {o.operario_nombre
                      ? `${o.operario_nombre} (${o.operario_email})`
                      : "No asignado"}
                  </td>
                  <td className="p-2 space-x-1">
                    {o.estado === "En Proceso" && (
                      <>
                        <button
                          className="bg-green-100 text-green-700 border border-green-300 px-2 py-1 rounded hover:bg-green-200"
                          onClick={() =>
                            handleStatusChange(o.pedido_id, "Terminado")
                          }
                        >
                          Terminar
                        </button>
                        <button
                          className="bg-red-100 text-red-700 border border-red-300 px-2 py-1 rounded hover:bg-red-200"
                          onClick={() =>
                            handleStatusChange(o.pedido_id, "Cancelado")
                          }
                        >
                          Cancelar
                        </button>
                        <button
                          className="bg-gray-100 text-gray-700 border border-gray-300 px-2 py-1 rounded hover:bg-gray-200"
                          onClick={() => handleEdit(o)}
                        >
                          Editar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan="10"
                  className="text-center py-4 text-gray-500 italic"
                >
                  No hay pedidos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Paginación */}
      {filtered.length > itemsPorPagina && (
        <div className="flex justify-center items-center mt-4 gap-2 flex-wrap">
          <button
            onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
            disabled={paginaActual === 1}
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              paginaActual === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            « Anterior
          </button>

          {Array.from(
            { length: Math.ceil(filtered.length / itemsPorPagina) },
            (_, i) => (
              <button
                key={i}
                onClick={() => setPaginaActual(i + 1)}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  paginaActual === i + 1
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            )
          )}

          <button
            onClick={() =>
              setPaginaActual((p) =>
                Math.min(p + 1, Math.ceil(filtered.length / itemsPorPagina))
              )
            }
            disabled={
              paginaActual === Math.ceil(filtered.length / itemsPorPagina)
            }
            className={`px-3 py-1.5 rounded-lg border text-sm ${
              paginaActual ===
              Math.ceil(filtered.length / itemsPorPagina)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Siguiente »
          </button>
        </div>
      )}

      {/* ✏️ Modal de Edición */}
      <EditOrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        onSave={handleSave}
      />
    </div>
  );
}
