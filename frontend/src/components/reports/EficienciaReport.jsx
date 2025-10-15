import { useEffect, useState } from "react";
import { getEficiencia } from "../../api/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function EficienciaReport() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEficiencia(from, to);
      setData(res);
    } catch (e) {
      console.error("Error cargando eficiencia:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data)
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-gray-500 italic">
        Cargando reporte de eficiencia...
      </div>
    );

  const { resumen = {}, detalle = [] } = data;

  const eficienciaPedidos =
    resumen.total_pedidos > 0
      ? ((resumen.pedidos_completados / resumen.total_pedidos) * 100).toFixed(2)
      : 0;

  const eficienciaTareas =
    resumen.total_tareas > 0
      ? ((resumen.tareas_completadas / resumen.total_tareas) * 100).toFixed(2)
      : 0;

  // 🔹 Exportar a PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Reporte de Eficiencia Operativa", 14, 16);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 24);

    let filtros = [];
    if (from) filtros.push(`Desde: ${new Date(from).toLocaleDateString("es-ES")}`);
    if (to) filtros.push(`Hasta: ${new Date(to).toLocaleDateString("es-ES")}`);
    if (filtros.length > 0) doc.text(`Filtros: ${filtros.join(" | ")}`, 14, 30);

    const resumenY = filtros.length > 0 ? 36 : 32;
    doc.setFontSize(11);
    doc.text("Resumen General:", 14, resumenY);

    autoTable(doc, {
      startY: resumenY + 4,
      head: [["Métrica", "Valor"]],
      body: [
        ["Pedidos Totales", resumen.total_pedidos ?? 0],
        ["Pedidos Completados", resumen.pedidos_completados ?? 0],
        ["% Eficiencia Pedidos", eficienciaPedidos + "%"],
        ["Tareas Totales", resumen.total_tareas ?? 0],
        ["Tareas Completadas", resumen.tareas_completadas ?? 0],
        ["% Eficiencia Tareas", eficienciaTareas + "%"],
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });

    if (detalle.length > 0) {
      doc.text("Detalle por Operario:", 14, doc.lastAutoTable.finalY + 12);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 18,
        head: [["Operario", "Tareas Completadas"]],
        body: detalle.map((d) => [d.operario, d.tareas_completadas]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      });
    }

    doc.save("eficiencia_operativa.pdf");
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
          📊 Reporte de Eficiencia Operativa
        </h2>
        <button
          onClick={exportPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm"
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* 🔎 Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
          >
            🔍 {loading ? "Cargando..." : "Aplicar Filtro"}
          </button>
        </div>
      </div>

      {/* 🔹 Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm space-y-1 text-sm">
          <p><strong>Pedidos Totales:</strong> {resumen.total_pedidos ?? 0}</p>
          <p>
            <strong>Pedidos Completados:</strong>{" "}
            {resumen.pedidos_completados ?? 0}{" "}
            <span
              className={
                eficienciaPedidos > 80
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              ({eficienciaPedidos}%)
            </span>
          </p>
          <p><strong>Tareas Totales:</strong> {resumen.total_tareas ?? 0}</p>
          <p>
            <strong>Tareas Completadas:</strong>{" "}
            {resumen.tareas_completadas ?? 0}{" "}
            <span
              className={
                eficienciaTareas > 80
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              ({eficienciaTareas}%)
            </span>
          </p>
        </div>

        {/* Indicadores visuales */}
        <div className="flex flex-col justify-center p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm text-center space-y-2">
          <h4 className="text-gray-800 font-semibold text-sm">Eficiencia Global</h4>
          <div className="flex justify-around mt-2">
            <div>
              <span className="text-2xl font-bold text-blue-600">
                {eficienciaPedidos}%
              </span>
              <p className="text-xs text-gray-600">Pedidos</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-green-600">
                {eficienciaTareas}%
              </span>
              <p className="text-xs text-gray-600">Tareas</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Detalle por operario */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          👷 Detalle por Operario
        </h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th className="border px-3 py-2 text-left">Operario</th>
                <th className="border px-3 py-2 text-center">Tareas Completadas</th>
              </tr>
            </thead>
            <tbody>
              {detalle.length > 0 ? (
                detalle.map((d, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="border px-3 py-2">{d.operario}</td>
                    <td className="border px-3 py-2 text-center text-blue-700 font-medium">
                      {d.tareas_completadas}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="text-center py-4 text-gray-500 italic"
                  >
                    No hay datos disponibles para el rango seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
