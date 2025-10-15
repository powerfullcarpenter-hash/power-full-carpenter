import { useEffect, useState } from "react";
import { getTiempos } from "../../api/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function TiemposReport() {
  const [resumen, setResumen] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [operarioFilter, setOperarioFilter] = useState("Todos");
  const [loading, setLoading] = useState(false);

  // 🔹 Obtener y procesar datos
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getTiempos();
        const detalleData = data.detalle || [];

        const agrupado = detalleData.reduce((acc, d) => {
          const key = d.operario;
          if (!acc[key]) acc[key] = { tareas: 0, totalSeg: 0 };
          acc[key].tareas += 1;
          acc[key].totalSeg += Number(d.tiempo_acumulado || 0);
          return acc;
        }, {});

        const resumenFinal = Object.entries(agrupado)
          .map(([operario, v]) => ({
            operario,
            tareas_completadas: v.tareas,
            promedio_seg: v.totalSeg / v.tareas,
            total_seg: v.totalSeg,
          }))
          .sort((a, b) => a.promedio_seg - b.promedio_seg);

        setDetalle(detalleData);
        setResumen(resumenFinal);
      } catch (err) {
        console.error("Error al cargar tiempos:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 Formateo de segundos a seg + horas
  const fmtTiempo = (segundos) => {
    const seg = Number(segundos || 0);
    const horas = seg / 3600;
    return `${seg.toLocaleString("es-ES")} seg (${horas.toFixed(2)} h)`;
  };

  // 🔹 Exportar a PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Reporte de Tiempos por Operario", 14, 16);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 24);

    const resumenFiltrado =
      operarioFilter === "Todos"
        ? resumen
        : resumen.filter((r) => r.operario === operarioFilter);

    const detalleFiltrado =
      operarioFilter === "Todos"
        ? detalle
        : detalle.filter((d) => d.operario === operarioFilter);

    // 📊 Tabla resumen
    autoTable(doc, {
      startY: 30,
      head: [["Operario", "Tareas Completadas", "Promedio", "Total"]],
      body: resumenFiltrado.map((r) => [
        r.operario,
        r.tareas_completadas,
        fmtTiempo(r.promedio_seg),
        fmtTiempo(r.total_seg),
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // 📋 Tabla detalle
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [
        ["ID Tarea", "Pedido", "Cliente", "Área", "Duración", "Fecha Fin", "Operario"],
      ],
      body: detalleFiltrado.map((d) => [
        d.task_id,
        d.pedido_id,
        d.nombre_cliente,
        d.area,
        fmtTiempo(d.tiempo_acumulado),
        d.fecha_fin ? new Date(d.fecha_fin).toLocaleString("es-ES") : "—",
        d.operario,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    doc.save(
      operarioFilter === "Todos"
        ? "reporte_tiempos.pdf"
        : `reporte_tiempos_${operarioFilter}.pdf`
    );
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
          ⏱ Reporte de Tiempos por Operario
        </h2>
        <button
          onClick={exportPDF}
          disabled={!resumen.length && !detalle.length}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
        >
          📄 Exportar PDF
        </button>
      </div>

      {/* 🔎 Filtro de operario */}
      <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Operario:
          </label>
          <select
            value={operarioFilter}
            onChange={(e) => setOperarioFilter(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500"
          >
            <option value="Todos">Todos</option>
            {resumen.map((r, idx) => (
              <option key={idx} value={r.operario}>
                {r.operario}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={exportPDF}
          disabled={!resumen.length}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
        >
          📊 Generar Reporte
        </button>
      </div>

      {/* 📊 Resumen */}
      <div className="mt-2">
        <h3 className="font-semibold text-gray-800 mb-3">📋 Resumen por Operario</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th className="border px-3 py-2 text-left">Operario</th>
                <th className="border px-3 py-2 text-center">Tareas Completadas</th>
                <th className="border px-3 py-2 text-center">Promedio</th>
                <th className="border px-3 py-2 text-center">Total</th>
              </tr>
            </thead>
            <tbody>
              {resumen.length > 0 ? (
                resumen.map((r, idx) => (
                  <tr
                    key={idx}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="border px-3 py-2">{r.operario}</td>
                    <td className="border px-3 py-2 text-center">{r.tareas_completadas}</td>
                    <td className="border px-3 py-2 text-center text-blue-700 font-medium">
                      {fmtTiempo(r.promedio_seg)}
                    </td>
                    <td className="border px-3 py-2 text-center text-green-700 font-medium">
                      {fmtTiempo(r.total_seg)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500 italic">
                    No hay datos disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📋 Detalle */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-800 mb-3">🧾 Detalle de Tareas</h3>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th className="border px-3 py-2 text-left">ID Tarea</th>
                <th className="border px-3 py-2 text-left">Pedido</th>
                <th className="border px-3 py-2 text-left">Cliente</th>
                <th className="border px-3 py-2 text-left">Área</th>
                <th className="border px-3 py-2 text-center">Duración</th>
                <th className="border px-3 py-2 text-center">Fecha Fin</th>
                <th className="border px-3 py-2 text-left">Operario</th>
              </tr>
            </thead>
            <tbody>
              {(operarioFilter === "Todos"
                ? detalle
                : detalle.filter((d) => d.operario === operarioFilter)
              ).map((d, idx) => (
                <tr
                  key={d.task_id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border px-3 py-2">{d.task_id}</td>
                  <td className="border px-3 py-2">{d.pedido_id}</td>
                  <td className="border px-3 py-2">{d.nombre_cliente}</td>
                  <td className="border px-3 py-2">{d.area}</td>
                  <td className="border px-3 py-2 text-center text-blue-700 font-medium">
                    {fmtTiempo(d.tiempo_acumulado)}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {d.fecha_fin
                      ? new Date(d.fecha_fin).toLocaleString("es-ES")
                      : "—"}
                  </td>
                  <td className="border px-3 py-2">{d.operario}</td>
                </tr>
              ))}
              {detalle.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500 italic">
                    No hay tareas registradas
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
