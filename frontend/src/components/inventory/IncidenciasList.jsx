import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../contexts/AppContext";
import { getIncidencias, updateIncidenciaEstado } from "../../api/inventory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function IncidenciasList() {
  const [incidencias, setIncidencias] = useState([]);
  const [filteredIncidencias, setFilteredIncidencias] = useState([]);
  const [filterOperario, setFilterOperario] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterUrgencia, setFilterUrgencia] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAppContext();

  const fetchData = async () => {
    try {
      const data = await getIncidencias();
      setIncidencias(data);
    } catch (err) {
      console.error("Error cargando incidencias", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = incidencias.filter((i) => {
      const matchOperario = filterOperario ? i.operario_nombre === filterOperario : true;
      const matchTipo = filterTipo ? i.tipo === filterTipo : true;
      const matchUrgencia = filterUrgencia ? i.urgencia === filterUrgencia : true;
      return matchOperario && matchTipo && matchUrgencia;
    });
    setFilteredIncidencias(filtered);
  }, [incidencias, filterOperario, filterTipo, filterUrgencia]);

  const handleEstado = async (id, estado) => {
    try {
      await updateIncidenciaEstado(id, estado);
      setIncidencias((prev) =>
        prev.map((inc) => (inc.incidencia_id === id ? { ...inc, estado } : inc))
      );
    } catch (err) {
      console.error("Error actualizando estado", err);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Incidencias", 14, 16);
    const headers = ["Fecha", "Operario", "Tarea", "Tipo", "Descripción", "Urgencia", "Estado"];
    const data = filteredIncidencias.map((i) => [
      new Date(i.fecha).toLocaleString("es-ES"),
      i.operario_nombre,
      i.tarea_titulo,
      i.tipo,
      i.descripcion,
      i.urgencia,
      i.estado,
    ]);
    autoTable(doc, { head: [headers], body: data, startY: 22 });
    doc.save("reporte_incidencias.pdf");
  };

  const filterOptions = {
    operarios: [...new Set(incidencias.map((i) => i.operario_nombre))],
    tipos: [...new Set(incidencias.map((i) => i.tipo))],
    urgencias: [...new Set(incidencias.map((i) => i.urgencia))],
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        {user?.role?.toLowerCase() === "supervisor" && (
          <button
            onClick={() => navigate("/dashboard")}
            className="mb-3 sm:mb-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 shadow-sm transition"
          >
            ← Ir al Dashboard
          </button>
        )}
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight text-center flex-1">
          🛠️ Gestión de Incidencias
        </h1>
      </div>

      {/* 🔹 Filtros + Exportar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Filtros</h2>
        <div className="flex flex-wrap gap-3">
          <select
            onChange={(e) => setFilterOperario(e.target.value)}
            value={filterOperario}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Operarios</option>
            {filterOptions.operarios.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => setFilterTipo(e.target.value)}
            value={filterTipo}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los Tipos</option>
            {filterOptions.tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => setFilterUrgencia(e.target.value)}
            value={filterUrgencia}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las Urgencias</option>
            {filterOptions.urgencias.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportPDF}
            className="ml-auto bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 active:bg-green-800 shadow-sm transition"
            disabled={!filteredIncidencias.length}
          >
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* 🔹 Estado de carga */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 text-sm">Cargando incidencias...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-gray-700 font-semibold">Fecha</th>
                <th className="p-3 text-gray-700 font-semibold">Operario</th>
                <th className="p-3 text-gray-700 font-semibold">Tarea</th>
                <th className="p-3 text-gray-700 font-semibold">Tipo</th>
                <th className="p-3 text-gray-700 font-semibold">Descripción</th>
                <th className="p-3 text-gray-700 font-semibold">Urgencia</th>
                <th className="p-3 text-gray-700 font-semibold">Estado</th>
                <th className="p-3 text-gray-700 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidencias.length > 0 ? (
                filteredIncidencias.map((i, idx) => (
                  <tr
                    key={i.incidencia_id}
                    className={`transition hover:bg-blue-50/30 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-3 text-gray-600 whitespace-nowrap">
                      {new Date(i.fecha).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 font-medium text-gray-800">{i.operario_nombre}</td>
                    <td className="p-3 text-gray-700">{i.tarea_titulo}</td>
                    <td className="p-3 text-gray-700">{i.tipo}</td>
                    <td className="p-3 text-gray-600">{i.descripcion}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize
                          ${
                            i.urgencia === "alta"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : i.urgencia === "media"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-green-100 text-green-700 border-green-200"
                          }`}
                      >
                        {i.urgencia}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border
                          ${
                            i.estado === "Pendiente"
                              ? "bg-gray-100 text-gray-700 border-gray-200"
                              : i.estado === "En revisión"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : "bg-green-100 text-green-700 border-green-200"
                          }`}
                      >
                        {i.estado}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {i.estado === "Pendiente" && (
                        <button
                          onClick={() => handleEstado(i.incidencia_id, "En revisión")}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-yellow-600 transition"
                        >
                          Revisar
                        </button>
                      )}
                      {i.estado === "En revisión" && (
                        <button
                          onClick={() => handleEstado(i.incidencia_id, "Resuelto")}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                        >
                          Resolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center p-6 text-gray-500 italic"
                  >
                    No hay incidencias que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
