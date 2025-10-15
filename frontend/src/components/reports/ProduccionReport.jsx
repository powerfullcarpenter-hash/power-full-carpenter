import { useEffect, useState } from "react";
import { getProduccion } from "../../api/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProduccionReport() {
  const [data, setData] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getProduccion(from, to);

      // 🔹 Filtro adicional por pedidoId
      const filtrado = pedidoId
        ? res.filter((d) => String(d.pedido_id) === pedidoId)
        : res;

      setData(filtrado);
    } catch (error) {
      console.error("Error cargando producción:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Exportar PDF
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Reporte de Producción", 14, 16);

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 14, 24);

    const filtros = [];
    if (from) filtros.push(`Desde: ${new Date(from).toLocaleDateString("es-ES")}`);
    if (to) filtros.push(`Hasta: ${new Date(to).toLocaleDateString("es-ES")}`);
    if (pedidoId) filtros.push(`Pedido: ${pedidoId}`);
    if (filtros.length > 0) doc.text(`Filtros: ${filtros.join(" | ")}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["ID Pedido", "Cliente", "Fecha Creación", "Fecha Cierre"]],
      body: data.map((d) => [
        d.pedido_id,
        d.nombre_cliente || "—",
        d.fecha_creacion
          ? new Date(d.fecha_creacion).toLocaleDateString("es-ES")
          : "—",
        d.fecha_cierre
          ? new Date(d.fecha_cierre).toLocaleDateString("es-ES")
          : "Pendiente",
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("reporte_produccion.pdf");
  };

  // 🔹 Exportar CSV
  const exportCSV = () => {
    if (!data.length) return;
    const rows = [
      ["ID Pedido", "Cliente", "Fecha Creación", "Fecha Cierre"],
      ...data.map((d) => [
        d.pedido_id,
        d.nombre_cliente,
        d.fecha_creacion,
        d.fecha_cierre,
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "reporte_produccion.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
          📦 Reporte de Producción
        </h3>
        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition text-sm font-medium shadow-sm"
          >
            📄 PDF
          </button>
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition text-sm font-medium shadow-sm"
          >
            📊 Excel
          </button>
        </div>
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
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pedido ID:</label>
          <input
            type="text"
            placeholder="Ej: 105"
            value={pedidoId}
            onChange={(e) => setPedidoId(e.target.value)}
            className="border px-3 py-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
          >
            🔍 {loading ? "Cargando..." : "Filtrar"}
          </button>
        </div>
      </div>

      {/* 📊 Resumen */}
      <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 shadow-sm">
        <p className="font-medium text-gray-700 text-sm">
          Total de pedidos terminados:{" "}
          <span className="font-bold text-blue-700">{data.length}</span>
        </p>
      </div>

      {/* 🧾 Tabla */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="border px-3 py-2 text-left">ID Pedido</th>
              <th className="border px-3 py-2 text-left">Cliente</th>
              <th className="border px-3 py-2 text-center">Fecha Creación</th>
              <th className="border px-3 py-2 text-center">Fecha Cierre</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((d, i) => (
                <tr
                  key={d.pedido_id}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border px-3 py-2">{d.pedido_id}</td>
                  <td className="border px-3 py-2">{d.nombre_cliente || "—"}</td>
                  <td className="border px-3 py-2 text-center">
                    {d.fecha_creacion
                      ? new Date(d.fecha_creacion).toLocaleDateString("es-ES")
                      : "—"}
                  </td>
                  <td
                    className={`border px-3 py-2 text-center font-semibold ${
                      d.fecha_cierre ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {d.fecha_cierre
                      ? new Date(d.fecha_cierre).toLocaleDateString("es-ES")
                      : "Pendiente"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 italic">
                  No hay registros en el rango seleccionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
