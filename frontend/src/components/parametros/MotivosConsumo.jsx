import { useEffect, useState } from "react";
import { getParametros, addParametro, updateParametro, deleteParametro } from "../../api/parametros";

export default function MotivosConsumo() {
  const [motivos, setMotivos] = useState([]);
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState(null);
  const [valorEdit, setValorEdit] = useState("");

  // 🔹 Cargar motivos
  const loadData = async () => {
    try {
      const data = await getParametros("motivos_consumo");
      setMotivos(data || []);
    } catch (err) {
      console.error("Error cargando motivos:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Agregar
  const handleAdd = async () => {
    if (!nuevo.trim()) return alert("Debes ingresar un motivo válido.");
    try {
      await addParametro("motivos_consumo", nuevo.trim());
      setNuevo("");
      loadData();
    } catch (err) {
      console.error("Error agregando motivo:", err);
      alert("Ocurrió un error al agregar el motivo.");
    }
  };

  // 🔹 Editar
  const handleEdit = (motivo) => {
    setEditando(motivo.parametro_id);
    setValorEdit(motivo.valor);
  };

  const handleSaveEdit = async () => {
    if (!valorEdit.trim()) return alert("El valor no puede estar vacío.");
    try {
      await updateParametro(editando, valorEdit.trim(), "motivos_consumo");
      setEditando(null);
      setValorEdit("");
      loadData();
    } catch (err) {
      console.error("Error editando motivo:", err);
      alert("Error al guardar los cambios.");
    }
  };

  // 🔹 Eliminar
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este motivo?")) {
      await deleteParametro(id, "motivos_consumo");
      loadData();
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
        📝 Motivos de Consumo / Desperdicio
      </h3>

      {/* 🔹 Tabla de motivos */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Motivo</th>
              {/* Se mantiene w-40 para que la columna de acciones sea un poco más ancha */}
              <th className="px-3 py-2 border text-center w-40">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {motivos.map((m, idx) => (
              <tr
                key={m.parametro_id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-3 py-2 border">
                  {editando === m.parametro_id ? (
                    <input
                      type="text"
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="w-full border px-2 py-1 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span>{m.valor}</span>
                  )}
                </td>
                
                {/* 💡 INICIO DE CORRECCIÓN: Se eliminó 'space-x-2' del <td> y se agregó un div con flex-col y gap. */}
                <td className="px-3 py-2 border text-center">
                  {editando === m.parametro_id ? (
                    // Botones en modo edición: se usa 'flex' para mantenerlos lado a lado, añadiendo 'space-x-2' para separarlos.
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
                    // Botones en modo normal: usamos 'flex flex-col' para apilarlos y 'gap-1' para separarlos.
                    <div className="flex flex-col gap-1 items-center">
                      <button
                        onClick={() => handleEdit(m)}
                        className="bg-yellow-100 text-yellow-700 border border-yellow-300 w-full px-3 py-1 rounded hover:bg-yellow-200 transition text-sm"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(m.parametro_id)}
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
            {motivos.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center py-5 text-gray-500 italic">
                  No hay motivos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Formulario para agregar nuevo */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-gray-200 pt-4">
        <input
          type="text"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Escribe un nuevo motivo..."
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