import { useEffect, useState } from "react";
import { getInsumos, addInsumo, updateInsumo, deleteInsumo } from "../../api/insumos";

export default function CatalogoInsumos() {
  const [insumos, setInsumos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    nombre: "",
    unidad_medida: "",
    stock: 0,
    stock_minimo: 0,
    subcategoria: ""
  });

  // 🔹 Cargar datos
  const loadData = async () => {
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (err) {
      console.error("Error cargando insumos:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Abrir modal
  const handleOpenModal = (item = null) => {
    if (item) {
      setEditando(item.insumo_id);
      setForm({
        nombre: item.nombre,
        unidad_medida: item.unidad_medida || "",
        stock: item.stock || 0,
        stock_minimo: item.stock_minimo || 0,
        subcategoria: item.subcategoria || ""
      });
    } else {
      setEditando(null);
      setForm({ nombre: "", unidad_medida: "", stock: 0, stock_minimo: 0, subcategoria: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({ nombre: "", unidad_medida: "", stock: 0, stock_minimo: 0, subcategoria: "" });
  };

  // 🔹 Manejo de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Guardar
  const handleSubmit = async () => {
    try {
      if (!form.nombre.trim()) {
        alert("El nombre del insumo es obligatorio");
        return;
      }
      if (editando) {
        await updateInsumo(editando, { ...form });
      } else {
        await addInsumo({ ...form });
      }
      handleCloseModal();
      loadData();
    } catch (err) {
      console.error("Error guardando insumo:", err);
      alert("Ocurrió un error al guardar el insumo.");
    }
  };

  // 🔹 Eliminar
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este insumo?")) {
      await deleteInsumo(id);
      loadData();
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
          📦 Catálogo de Insumos
        </h3>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium"
        >
          ➕ Agregar Insumo
        </button>
      </div>

      {/* Tabla de insumos */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border">Insumo</th>
              <th className="px-3 py-2 border">Unidad</th>
              <th className="px-3 py-2 border text-center">Stock</th>
              <th className="px-3 py-2 border text-center">Mínimo</th>
              <th className="px-3 py-2 border">Categoría</th>
              <th className="px-3 py-2 border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumos.map((i, idx) => (
              <tr
                key={i.insumo_id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-3 py-2 border font-medium">{i.nombre}</td>
                <td className="px-3 py-2 border">{i.unidad_medida}</td>
                <td className="px-3 py-2 border text-center">{i.stock}</td>
                <td className="px-3 py-2 border text-center">{i.stock_minimo}</td>
                <td className="px-3 py-2 border">{i.subcategoria || "—"}</td>
                <td className="px-3 py-2 border text-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(i)}
                    className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1 rounded hover:bg-yellow-200 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(i.insumo_id)}
                    className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded hover:bg-red-200 transition"
                  >
                    🗑 Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {insumos.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-5 text-gray-500 italic">
                  No hay insumos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de registro / edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xl w-full max-w-md relative animate-fade-in-down border border-gray-100">
            {/* Cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            {/* Título */}
            <h3 className="text-xl font-extrabold text-gray-800 mb-4">
              {editando ? "✏️ Editar Insumo" : "➕ Agregar Insumo"}
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre del insumo"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />

              <input
                type="text"
                name="unidad_medida"
                value={form.unidad_medida}
                onChange={handleChange}
                placeholder="Unidad (ej: m², litros, unidades)"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="Stock"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={form.stock_minimo}
                    onChange={handleChange}
                    placeholder="Mínimo"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <input
                type="text"
                name="subcategoria"
                value={form.subcategoria}
                onChange={handleChange}
                placeholder="Categoría (ej: Ferretería, Pintura, Materiales)"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium shadow-sm"
              >
                {editando ? "💾 Guardar Cambios" : "✅ Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
