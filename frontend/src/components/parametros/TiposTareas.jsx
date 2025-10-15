import { useEffect, useState } from "react";
import {
  getParametros,
  addParametro,
  deleteParametro,
} from "../../api/parametros";

export default function TiposTareas() {
  const [areas, setAreas] = useState([]);
  const [nuevo, setNuevo] = useState("");

  // 🔹 Cargar datos dinámicos
  const loadData = async () => {
    try {
      const data = await getParametros("area");
      setAreas(data || []);
    } catch (err) {
      console.error("Error cargando áreas:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Agregar nueva área
  const handleAdd = async () => {
    if (!nuevo.trim()) {
      alert("Debes ingresar el nombre del área.");
      return;
    }
    try {
      await addParametro("area", nuevo.trim());
      setNuevo("");
      loadData();
    } catch (err) {
      console.error("Error al agregar área:", err);
      alert("Ocurrió un error al agregar el área.");
    }
  };

  // 🔹 Eliminar área
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta área?")) {
      try {
        await deleteParametro(id, "area");
        loadData();
      } catch (err) {
        console.error("Error eliminando área:", err);
        alert("No se pudo eliminar el área.");
      }
    }
  };

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Encabezado */}
      <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
        🏭 Áreas / Tipos de Tareas
      </h3>

      {/* 🔹 Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Área / Tipo de tarea</th>
              <th className="px-3 py-2 border text-center w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a, idx) => (
              <tr
                key={a.parametro_id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-3 py-2 border font-medium">{a.valor}</td>
                <td className="px-3 py-2 border text-center">
                  <button
                    onClick={() => handleDelete(a.parametro_id)}
                    className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded hover:bg-red-200 transition text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {areas.length === 0 && (
              <tr>
                <td
                  colSpan="2"
                  className="text-center py-5 text-gray-500 italic"
                >
                  No hay áreas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Formulario de agregar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-t border-gray-200 pt-4">
        <input
          type="text"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Nueva área o tipo de tarea (ej: Corte, Ensamblado, Acabado...)"
          className="flex-1 border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition text-sm font-medium shadow-sm"
        >
          ➕ Agregar
        </button>
      </div>
    </div>
  );
}
