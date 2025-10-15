import React from "react";

// El componente recibe los insumos como props
export default function InventoryList({ insumos }) {
  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* 🔹 Título */}
      <h2 className="text-2xl font-extrabold text-gray-800 mb-4 sm:mb-6 tracking-tight flex items-center">
        📦 Inventario de Insumos
      </h2>

      {/* 🔹 Contenedor responsive */}
      <div className="overflow-x-auto -mx-2 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-3 text-gray-700 font-semibold whitespace-nowrap">
                  Nombre
                </th>
                <th className="p-3 text-gray-700 font-semibold whitespace-nowrap">
                  Unidad
                </th>
                <th className="p-3 text-gray-700 font-semibold whitespace-nowrap">
                  Stock
                </th>
                <th className="p-3 text-gray-700 font-semibold whitespace-nowrap">
                  Stock mínimo
                </th>
              </tr>
            </thead>
            <tbody>
              {insumos.length > 0 ? (
                insumos.map((i, idx) => (
                  <tr
                    key={i.insumo_id}
                    className={`hover:bg-gray-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                      {i.nombre}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {i.unidad_medida}
                    </td>
                    <td
                      className={`p-3 font-semibold whitespace-nowrap ${
                        parseFloat(i.stock) <= parseFloat(i.stock_minimo)
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {i.stock}
                    </td>
                    <td className="p-3 text-gray-700 whitespace-nowrap">
                      {i.stock_minimo}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-gray-500 italic"
                  >
                    No hay insumos registrados en el inventario.
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
