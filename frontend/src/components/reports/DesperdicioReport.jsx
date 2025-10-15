import { useEffect, useState } from "react";
import { getDesperdicio } from "../../api/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function DesperdicioReport() {
  const [data, setData] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Obtener datos desde backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDesperdicio(from, to);
      setData(res);
    } catch (err) {
      console.error("Error cargando desperdicio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Exportar a PDF
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Reporte de Desperdicio de Insumos", 14, 16);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 24);

    // Filtros activos
    let filtros = [];
    if (from) filtros.push(`Desde: ${new Date(from).toLocaleDateString("es-ES")}`);
    if (to) filtros.push(`Hasta: ${new Date(to).toLocaleDateString("es-ES")}`);
    if (filtros.length > 0) doc.text(`Filtros: ${filtros.join(" | ")}`, 14, 30);

    const resumenY = filtros.length > 0 ? 36 : 32;
    const totalSalida = data.total_salida || 0;
    const totalDesperdicio = data.total_ajuste || 0;
    const porcentaje = data.porcentaje || 0;

    doc.setFontSize(11);
    doc.text(
      `Se procesaron ${totalSalida} insumos con un desperdicio total de ${totalDesperdicio} (${porcentaje}%).`,
      14,
      resumenY
    );

    // Tabla resumen
    autoTable(doc, {
      startY: resumenY + 6,
      head: [["Total Salida", "Total Desperdicio", "Porcentaje"]],
      body: [[totalSalida, totalDesperdicio, porcentaje + " %"]],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });

    // Detalle por insumo
    if (data.detalle?.length) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Fecha", "Insumo", "Cantidad Ajustada", "Unidad", "Motivo"]],
        body: data.detalle.map((d) => [
          d.fecha || "—",
          d.insumo,
          d.cantidad_ajustada,
          d.unidad_medida,
          d.motivo || "—",
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [52, 152, 219], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });
    }

    doc.save("reporte_desperdicio.pdf");
  };

  if (!data)
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-gray-500 italic">
        Cargando reporte...
      </div>
    );

  const chartData = [
    { name: "Uso Normal", value: (data.total_salida || 0) - (data.total_ajuste || 0) },
    { name: "Desperdicio", value: data.total_ajuste || 0 },
  ];
  const COLORS = ["#4CAF50", "#F44336"];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
          🗑️ Reporte de Desperdicio
        </h3>
        <button
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition text-sm font-medium shadow-sm"
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

      {/* 🔹 Sección de resumen + gráfico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumen numérico */}
        <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm space-y-1 text-sm">
          <p><strong>Total Salida:</strong> {data.total_salida || 0}</p>
          <p><strong>Total Desperdicio:</strong> {data.total_ajuste || 0}</p>
          <p
            className={`${
              data.porcentaje > 10
                ? "text-red-600 font-bold"
                : "text-green-600 font-semibold"
            }`}
          >
            <strong>Porcentaje:</strong> {data.porcentaje || 0} %
          </p>
        </div>

        {/* Gráfico circular */}
        <div className="flex justify-center items-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔹 Tabla detallada */}
      <div className="mt-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
          📋 Detalle de Ajustes por Insumo
        </h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="w-full border-collapse text-sm text-gray-700">
            <thead className="bg-gray-100 text-gray-700 font-semibold">
              <tr>
                <th className="border px-3 py-2 text-left">Fecha</th>
                <th className="border px-3 py-2 text-left">Insumo</th>
                <th className="border px-3 py-2 text-center">Cantidad Ajustada</th>
                <th className="border px-3 py-2 text-center">Unidad</th>
                <th className="border px-3 py-2 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {data.detalle?.length > 0 ? (
                data.detalle.map((d, i) => (
                  <tr
                    key={i}
                    className={`${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition`}
                  >
                    <td className="border px-3 py-2">{d.fecha}</td>
                    <td className="border px-3 py-2">{d.insumo}</td>
                    <td className="border px-3 py-2 text-center text-blue-700 font-medium">
                      {d.cantidad_ajustada}
                    </td>
                    <td className="border px-3 py-2 text-center">{d.unidad_medida}</td>
                    <td className="border px-3 py-2">{d.motivo || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-4 text-gray-500 italic"
                  >
                    No hay registros de desperdicio en el rango seleccionado
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
