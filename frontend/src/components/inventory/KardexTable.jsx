import { useEffect, useState } from "react";
import { getKardex, getInsumos } from "../../api/inventory";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function KardexTable({ refresh }) {
  const [kardex, setKardex] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [insumoId, setInsumoId] = useState("Todos");

  const fetchKardex = async () => {
    try {
      const params = {
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
        ...(tipo && tipo !== "Todos" ? { tipo } : {}),
        ...(insumoId && insumoId !== "Todos" ? { insumoId } : {}),
      };
      const data = await getKardex(params);
      setKardex(data);
    } catch (err) {
      console.error("Error cargando kardex:", err);
    }
  };

  const fetchInsumos = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      console.error("Error cargando insumos:", err);
    }
  };

  const exportPDF = () => {
    if (!kardex.length) {
      alert("No hay datos para exportar con los filtros actuales.");
      return;
    }

    const filtros = [
      desde ? `Desde: ${new Date(desde).toLocaleDateString()}` : null,
      hasta ? `Hasta: ${new Date(hasta).toLocaleDateString()}` : null,
      tipo && tipo !== "Todos" ? `Tipo: ${tipo}` : null,
      insumoId !== "Todos"
        ? `Insumo: ${
            insumos.find((i) => String(i.insumo_id) === String(insumoId))?.nombre ||
            insumoId
          }`
        : null,
    ]
      .filter(Boolean)
      .join("  •  ");

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Historial de Movimientos (Kardex)", 14, 16);
    if (filtros) {
      doc.setFontSize(10);
      doc.text(filtros, 14, 22);
    }

    const body = kardex.map((k) => [
      new Date(k.fecha).toLocaleString(),
      k.insumo || "",
      k.tipo || "",
      k.cantidad ?? "",
      k.orden || "N/A",
      k.tarea || "N/A",
      k.responsable || "N/A",
      k.motivo || "N/A",
    ]);

    autoTable(doc, {
      startY: filtros ? 28 : 22,
      head: [
        ["Fecha", "Insumo", "Tipo", "Cantidad", "Orden", "Tarea", "Responsable", "Motivo"],
      ],
      body,
      styles: { fontSize: 8, overflow: "linebreak" },
      headStyles: { fontSize: 9, halign: "left" },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 25 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 40 },
      },
    });

    doc.save("kardex.pdf");
  };

  useEffect(() => {
    fetchInsumos();
  }, []);

  useEffect(() => {
    fetchKardex();
  }, [desde, hasta, tipo, insumoId, refresh]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      {/* 🔹 Encabezado */}
      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6 tracking-tight flex items-center">
        📑 Historial de Movimientos (Kardex)
      </h2>

      {/* 🔹 Filtros responsivos */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex flex-wrap gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option>Todos</option>
            <option>ENTRADA</option>
            <option>SALIDA</option>
            <option>AJUSTE</option>
          </select>

          <select
            value={insumoId}
            onChange={(e) => setInsumoId(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="Todos">Todos los Insumos</option>
            {insumos.map((i) => (
              <option key={i.insumo_id} value={i.insumo_id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto sm:ml-auto">
          <button
            onClick={exportPDF}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
            disabled={!kardex.length}
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* 🔹 Tabla responsive */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Fecha</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Insumo</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Tipo</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Cantidad</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Orden</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Tarea</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Responsable</th>
              <th className="p-2 sm:p-3 text-gray-700 font-semibold">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {kardex.length > 0 ? (
              kardex.map((k, idx) => (
                <tr
                  key={k.movimiento_id}
                  className={`hover:bg-gray-50 transition-colors ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                  }`}
                >
                  <td className="p-2 sm:p-3 text-gray-600 whitespace-nowrap">
                    {new Date(k.fecha).toLocaleString()}
                  </td>
                  <td className="p-2 sm:p-3 font-medium text-gray-800 whitespace-nowrap">
                    {k.insumo}
                  </td>
                  <td className="p-2 sm:p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize
                        ${
                          k.tipo === "ENTRADA"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : k.tipo === "SALIDA"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}
                    >
                      {k.tipo}
                    </span>
                  </td>
                  <td className="p-2 sm:p-3 text-gray-700">{k.cantidad}</td>
                  <td className="p-2 sm:p-3 text-gray-700">{k.orden}</td>
                  <td className="p-2 sm:p-3 text-gray-700">{k.tarea}</td>
                  <td className="p-2 sm:p-3 text-gray-700">{k.responsable}</td>
                  <td className="p-2 sm:p-3 text-gray-600">{k.motivo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="8"
                  className="text-center p-4 sm:p-6 text-gray-500 italic"
                >
                  No hay movimientos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
