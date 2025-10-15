import { useEffect, useState } from "react";
import { getNivelesStock, updateInsumo } from "../../api/insumos";

export default function NivelesStock() {
  const [niveles, setNiveles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Modal
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [form, setForm] = useState({ stock_minimo: 0 });

  // 🔹 Cargar niveles
  const loadData = async () => {
    setErr("");
    try {
      const data = await getNivelesStock();
      setNiveles(data || []);
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.error || "Error cargando niveles de stock");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = (row) => {
    setEditId(row.insumo_id);
    setEditNombre(row.nombre);
    setForm({ stock_minimo: Number(row.stock_minimo ?? 0) });
    setShow(true);
  };

  const closeModal = () => {
    setShow(false);
    setEditId(null);
    setEditNombre("");
    setForm({ stock_minimo: 0 });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErr("");

    const value = Number(form.stock_minimo);
    if (Number.isNaN(value) || value < 0) {
      setErr("El stock mínimo debe ser un número mayor o igual a 0.");
      setLoading(false);
      return;
    }

    try {
      await updateInsumo(editId, { stock_minimo: value });
      closeModal();
      await loadData();
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.error || "No se pudo actualizar el stock mínimo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Título */}
      <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
        📊 Niveles de Stock
      </h3>

      {/* 🔹 Mensaje de error */}
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
          {err}
        </div>
      )}

      {/* 🔹 Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Insumo</th>
              <th className="px-3 py-2 border text-left">Unidad</th>
              <th className="px-3 py-2 border text-center">Stock Actual</th>
              <th className="px-3 py-2 border text-center">Stock Mínimo</th>
              <th className="px-3 py-2 border text-center">Estado</th>
              <th className="px-3 py-2 border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {niveles.map((i, idx) => {
              const alerta = i.stock < i.stock_minimo ? "BAJO" : "OK";
              return (
                <tr
                  key={i.insumo_id}
                  className={`${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-gray-100 transition`}
                >
                  <td className="px-3 py-2 border font-medium">{i.nombre}</td>
                  <td className="px-3 py-2 border">{i.unidad_medida}</td>
                  <td className="px-3 py-2 border text-center">{i.stock}</td>
                  <td className="px-3 py-2 border text-center">
                    {i.stock_minimo ?? 0}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {alerta === "BAJO" ? (
                      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-300 font-semibold">
                        🔻 Stock Bajo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-300 font-semibold">
                        ✅ OK
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    <button
                      onClick={() => openModal(i)}
                      className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1 rounded hover:bg-yellow-200 transition text-sm"
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              );
            })}
            {niveles.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-5 text-gray-500 italic"
                >
                  Sin datos para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Modal de edición */}
      {show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in-down border border-gray-100">
            {/* Cerrar */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* Título */}
            <h3 className="text-xl font-extrabold text-gray-800 mb-4">
              ✏️ Editar Stock Mínimo
            </h3>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Insumo
                </label>
                <input
                  type="text"
                  value={editNombre}
                  disabled
                  className="w-full border px-3 py-2 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nuevo valor de Stock Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.stock_minimo}
                  onChange={(e) =>
                    setForm({ stock_minimo: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Ejemplo: 15"
                  autoFocus
                />
              </div>

              {err && (
                <p className="text-red-600 text-sm font-medium">{err}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium shadow-sm disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Guardando..." : "💾 Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
