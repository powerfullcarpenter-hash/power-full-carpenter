import { useEffect, useState } from "react";
import { getIncidencias, updateIncidenciaEstado } from "../../api/inventory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function InventoryMovements() {
  const [incidencias, setIncidencias] = useState([]);
  const [filteredIncidencias, setFilteredIncidencias] = useState([]);
  const [filterOperario, setFilterOperario] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterUrgencia, setFilterUrgencia] = useState("");

  const fetchData = async () => {
    try {
      const data = await getIncidencias();
      setIncidencias(data);
    } catch (err) {
      console.error("Error cargando incidencias", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = incidencias.filter((i) => {
      const operarioMatch = filterOperario ? i.operario_nombre === filterOperario : true;
      const tipoMatch = filterTipo ? i.tipo === filterTipo : true;
      const urgenciaMatch = filterUrgencia ? i.urgencia === filterUrgencia : true;
      return operarioMatch && tipoMatch && urgenciaMatch;
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
      new Date(i.fecha).toLocaleString(),
      i.operario_nombre,
      i.tarea_titulo,
      i.tipo,
      i.descripcion,
      i.urgencia,
      i.estado,
    ]);

    autoTable(doc, {
      head: [headers],
      body: data,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fontSize: 9, halign: "left" },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 15 },
        4: { cellWidth: 40 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
      },
    });

    doc.save("incidencias_reporte.pdf");
  };

  const filterOptions = {
    operarios: [...new Set(incidencias.map((i) => i.operario_nombre))],
    tipos: [...new Set(incidencias.map((i) => i.tipo))],
    urgencias: [...new Set(incidencias.map((i) => i.urgencia))],
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-3 sm:mb-0">
          📋 Incidencias reportadas
        </h2>
        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 shadow-sm transition"
        >
          Exportar PDF
        </button>
      </div>

      {/* 🔹 Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          onChange={(e) => setFilterOperario(e.target.value)}
          value={filterOperario}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Filtrar por Operario</option>
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
          <option value="">Filtrar por Tipo</option>
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
          <option value="">Filtrar por Urgencia</option>
          {filterOptions.urgencias.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      {/* 🔹 Tabla Responsive */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Fecha</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Operario</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Tarea</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Tipo</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Descripción</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Urgencia</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Estado</th>
              <th className="p-2 sm:p-3 border text-gray-700 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidencias.length > 0 ? (
              filteredIncidencias.map((i, idx) => (
                <tr
                  key={i.incidencia_id}
                  className={`hover:bg-gray-50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                >
                  <td className="p-2 sm:p-3 border text-gray-600 whitespace-nowrap">
                    {new Date(i.fecha).toLocaleString()}
                  </td>
                  <td className="p-2 sm:p-3 border text-gray-800">{i.operario_nombre}</td>
                  <td className="p-2 sm:p-3 border text-gray-700">{i.tarea_titulo}</td>
                  <td className="p-2 sm:p-3 border text-gray-700">{i.tipo}</td>
                  <td className="p-2 sm:p-3 border text-gray-600">{i.descripcion}</td>
                  <td className="p-2 sm:p-3 border text-gray-700">{i.urgencia}</td>
                  <td className="p-2 sm:p-3 border text-gray-700">{i.estado}</td>
                  <td className="p-2 sm:p-3 border text-center space-x-2">
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
                  className="text-center p-4 sm:p-6 text-gray-500 italic"
                >
                  No hay incidencias que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
