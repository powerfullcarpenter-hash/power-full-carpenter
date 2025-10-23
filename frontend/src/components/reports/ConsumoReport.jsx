import { useEffect, useState } from "react";
import { getConsumo } from "../../api/reports";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function ConsumoReport() {
  const [data, setData] = useState([]);
  const [pedidoId, setPedidoId] = useState("");
  const [loading, setLoading] = useState(false); // ✅ aquí estaba el problema

  const normalizeRow = (r) => ({
    ...r,
    cliente:
      r.nombre_cliente ??
      r.cliente ??
      r.pedido ??
      r.cliente_nombre ??
      "",
  });

  const fetchData = async () => {
    setLoading(true); // ✅ ahora sí existe
    try {
      const id = pedidoId?.toString().trim() ? Number(pedidoId) : null;
      const res = await getConsumo(id);
      setData(Array.isArray(res) ? res.map(normalizeRow) : []);
    } catch (err) {
      console.error("Error obteniendo consumo:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(14);
    doc.text("Reporte de Consumo de Insumos", 14, 16);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [["Pedido", "Cliente", "Insumo", "Cantidad", "Unidad"]],
      body: data.map((d) => [
        d.pedido_id,
        d.cliente,
        d.insumo,
        d.cantidad,
        d.unidad_medida,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`consumo${pedidoId ? `_pedido_${pedidoId}` : ""}.pdf`);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const rows = [
      ["Pedido ID", "Cliente", "Insumo", "Cantidad", "Unidad"],
      ...data.map((d) => [
        d.pedido_id,
        d.cliente,
        d.insumo,
        d.cantidad,
        d.unidad_medida,
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "consumo.csv";
    link.click();
  };

  const totalPorInsumo = data.reduce((acc, item) => {
    acc[item.insumo] = (acc[item.insumo] || 0) + Number(item.cantidad || 0);
    return acc;
  }, {});

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
          📦 Reporte de Consumo de Insumos
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <input
          type="number"
          placeholder="Pedido ID (opcional)"
          value={pedidoId}
          onChange={(e) => setPedidoId(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm flex-1 focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={fetchData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
        >
          🔍 {loading ? "Cargando..." : "Filtrar"}
        </button>

        <button
          onClick={exportPDF}
          disabled={!data.length}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 active:bg-red-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
        >
          📄 Exportar PDF
        </button>

        <button
          onClick={exportCSV}
          disabled={!data.length}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 active:bg-green-800 transition text-sm font-medium shadow-sm disabled:opacity-50"
        >
          📊 Exportar CSV
        </button>
      </div>

      <p className="text-gray-700 font-medium">
        Total registros: <span className="font-bold">{data.length}</span> •
        Insumos distintos:{" "}
        <span className="font-bold">{Object.keys(totalPorInsumo).length}</span>
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Pedido</th>
              <th className="px-3 py-2 border text-left">Cliente</th>
              <th className="px-3 py-2 border text-left">Insumo</th>
              <th className="px-3 py-2 border text-center">Cantidad</th>
              <th className="px-3 py-2 border text-center">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((d, i) => (
                <tr
                  key={i}
                  className={`${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition`}
                >
                  <td className="border px-3 py-2">{d.pedido_id}</td>
                  <td className="border px-3 py-2">{d.cliente || "-"}</td>
                  <td className="border px-3 py-2">{d.insumo}</td>
                  <td className="border px-3 py-2 text-center font-medium text-blue-700">
                    {d.cantidad}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {d.unidad_medida}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-5 text-gray-500 italic"
                >
                  No hay registros de consumo
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {Object.keys(totalPorInsumo).length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-2">
            📦 Totales por Insumo
          </h4>
          <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
            {Object.entries(totalPorInsumo).map(([insumo, total]) => (
              <li key={insumo}>
                <span className="font-medium">{insumo}:</span> {total}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
