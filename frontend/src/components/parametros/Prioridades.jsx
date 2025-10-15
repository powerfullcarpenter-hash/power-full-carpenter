import { useEffect, useState } from "react";
import { getParametros, addParametro, updateParametro, deleteParametro } from "../../api/parametros";

export default function Prioridades() {
  const [prioridades, setPrioridades] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState(null);
  const [valorEdit, setValorEdit] = useState("");

  // 🔹 Cargar datos
  const loadData = async () => {
    try {
      const data = await getParametros("prioridad");
      setPrioridades(data || []);
    } catch (err) {
      console.error("Error cargando prioridades:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Agregar
  const handleAdd = async () => {
    if (!nuevo.trim()) return alert("Debes ingresar un nombre de prioridad.");
    try {
      await addParametro("prioridad", nuevo.trim());
      setNuevo("");
      loadData();
    } catch (err) {
      console.error("Error al agregar prioridad:", err);
      alert("Ocurrió un error al agregar la prioridad.");
    }
  };

  // 🔹 Editar
  const handleEdit = (item) => {
    setEditando(item.parametro_id);
    setValorEdit(item.valor);
  };

  const handleSaveEdit = async () => {
    if (!valorEdit.trim()) return alert("El valor no puede estar vacío.");
    try {
      await updateParametro(editando, valorEdit.trim(), "prioridad");
      setEditando(null);
      setValorEdit("");
      loadData();
    } catch (err) {
      console.error("Error actualizando prioridad:", err);
      alert("Error al guardar los cambios.");
    }
  };

  // 🔹 Eliminar
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta prioridad?")) {
      await deleteParametro(id, "prioridad");
      loadData();
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* Encabezado */}
      <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
        ⚡ Prioridades de Producción
      </h3>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Prioridad</th>
              <th className="px-3 py-2 border text-center w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {prioridades.map((p, idx) => (
              <tr
                key={p.parametro_id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-3 py-2 border">
                  {editando === p.parametro_id ? (
                    <input
                      type="text"
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">{p.valor}</span>
                  )}
                </td>
                
                {/* 💡 INICIO DE CORRECCIÓN: Se utiliza flex-col para apilar verticalmente */}
                <td className="px-3 py-2 border text-center">
                  {editando === p.parametro_id ? (
                    // Botones en modo edición: se mantienen en fila para ahorrar espacio
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-100 text-green-700 border border-green-300 px-3 py-1 rounded hover:bg-green-200 transition text-sm"
                      >
                        💾 Guardar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        className="bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 rounded hover:bg-gray-200 transition text-sm"
                      >
                        ✖ Cancelar
                      </button>
                    </div>
                  ) : (
                    // Botones en modo normal: usamos 'flex flex-col' y 'gap-1'
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        onClick={() => handleEdit(p)}
                        className="bg-yellow-100 text-yellow-700 border border-yellow-300 w-full px-3 py-1 rounded hover:bg-yellow-200 transition text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.parametro_id)}
                        className="bg-red-100 text-red-700 border border-red-300 w-full px-3 py-1 rounded hover:bg-red-200 transition text-sm"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  )}
                </td>
                {/* 💡 FIN DE CORRECCIÓN */}

              </tr>
            ))}
            {prioridades.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center py-5 text-gray-500 italic">
                  No hay prioridades registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Formulario para agregar nueva prioridad */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-gray-200 pt-4">
        <input
          type="text"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nueva prioridad (Ej: Alta, Media, Baja)"
          className="flex-1 border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium"
        >
          ➕ Agregar
        </button>
      </div>
    </div>
  );
}