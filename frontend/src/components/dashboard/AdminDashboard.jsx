import { useEffect, useState } from "react";
import { getInsumos } from "../../api/inventory";
import { getProduccion, getEficiencia } from "../../api/reports";

export default function AdminDashboard() {
  const [insumos, setInsumos] = useState([]);
  const [produccion, setProduccion] = useState([]);
  const [eficiencia, setEficiencia] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ins, prod, ef] = await Promise.all([
          getInsumos(),
          getProduccion(),
          getEficiencia(),
        ]);
        setInsumos(ins);
        setProduccion(prod);
        setEficiencia(ef);
      } catch (e) {
        console.error("Error cargando dashboard", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm font-medium">
            Cargando datos del Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 🔹 Encabezado */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-6 text-center">
        Panel de Control del Administrador 📊
      </h1>

      {/* 🔹 Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 🧱 Inventario */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            📦 Inventario (Stock Bajo)
          </h2>
          {insumos.filter((i) => i.stock <= i.stock_minimo).length > 0 ? (
            <ul className="space-y-2 text-gray-600 max-h-60 overflow-y-auto pr-2">
              {insumos
                .filter((i) => i.stock <= i.stock_minimo)
                .map((i) => (
                  <li
                    key={i.insumo_id}
                    className="p-2 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm"
                  >
                    <span className="font-semibold">{i.nombre}</span> —{" "}
                    {i.stock} {i.unidad_medida}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              Todo el stock está en buen nivel ✅
            </p>
          )}
        </div>

        {/* 🏭 Producción */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            🏭 Producción Terminada
          </h2>
          {produccion.length > 0 ? (
            <ul className="space-y-2 text-gray-600 max-h-60 overflow-y-auto pr-2">
              {produccion.map((p) => (
                <li
                  key={p.pedido_id}
                  className="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-sm"
                >
                  Pedido <strong>#{p.pedido_id}</strong> —{" "}
                  <span className="italic">{p.nombre_cliente}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">
              No hay producción registrada
            </p>
          )}
        </div>
      </div>

      {/* 🔹 Eficiencia */}
      {eficiencia && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
            ⚙️ Indicadores de Eficiencia
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
            <div className="p-4 rounded-lg bg-green-50 border border-green-100 text-center">
              <p className="text-sm text-gray-600">Pedidos Completados</p>
              <p className="text-xl font-bold text-green-700">
                {eficiencia.pedidos_completados} / {eficiencia.total_pedidos}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-100 text-center">
              <p className="text-sm text-gray-600">Tareas Completadas</p>
              <p className="text-xl font-bold text-yellow-700">
                {eficiencia.tareas_completadas} / {eficiencia.total_tareas}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
