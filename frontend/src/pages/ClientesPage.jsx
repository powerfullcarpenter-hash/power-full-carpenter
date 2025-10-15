// /frontend/src/pages/ClientesPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getClientes,
  addCliente,
  updateCliente,
  deleteCliente,
} from "../api/clientes";

// 🔹 Tabla de clientes (adaptable a móviles)
const ClientesTable = ({ clientes, handleEditar, handleEliminar, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200 overflow-x-auto">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        📋 Listado de Clientes
      </h2>
      {loading ? (
        <p className="text-gray-600">Cargando clientes...</p>
      ) : (
        <table className="w-full border text-xs sm:text-sm rounded-lg overflow-hidden shadow min-w-max">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Nombre</th>
              <th className="p-2 border">Teléfono</th>
              <th className="p-2 border">Correo</th>
              <th className="p-2 border">Dirección</th>
              <th className="p-2 border">Pedidos</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.cliente_id} className="text-center hover:bg-gray-50">
                <td className="border p-2">{c.cliente_id}</td>
                <td className="border p-2 font-semibold">{c.nombre}</td>
                <td className="border p-2">{c.telefono || "-"}</td>
                <td className="border p-2">{c.correo || "-"}</td>
                <td className="border p-2">{c.direccion || "-"}</td>
                <td className="border p-2">
                  <button
                    onClick={() =>
                      navigate(`/pedidos?cliente_id=${c.cliente_id}`)
                    }
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {c.total_pedidos || 0}
                  </button>
                </td>
                <td className="border p-2 flex flex-col sm:flex-row justify-center gap-2">
                  <button
                    onClick={() => handleEditar(c)}
                    className="px-2 sm:px-3 py-1 bg-yellow-400 text-gray-800 rounded hover:bg-yellow-500 transition text-xs"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(c.cliente_id)}
                    className="px-2 sm:px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs"
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && !loading && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500 italic">
                  No hay clientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState(null);
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch (err) {
      console.error("Error cargando clientes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    try {
      if (editCliente) {
        await updateCliente(editCliente.cliente_id, form);
      } else {
        await addCliente(form);
      }
      setShowModal(false);
      setForm({ nombre: "", telefono: "", correo: "", direccion: "" });
      setEditCliente(null);
      await cargarClientes();
    } catch (err) {
      alert(err.response?.data?.error || "Error guardando cliente");
    }
  };

  const handleEditar = (c) => {
    setEditCliente(c);
    setForm({
      nombre: c.nombre,
      telefono: c.telefono || "",
      correo: c.correo || "",
      direccion: c.direccion || "",
    });
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return;
    try {
      await deleteCliente(id);
      await cargarClientes();
    } catch (err) {
      alert(err.response?.data?.error || "Error eliminando cliente");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col items-center relative text-center">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-2 sm:left-0 top-0 sm:top-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          ← Ir al Dashboard
        </button>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-800 mt-12 sm:mt-0">
          Gestión de Clientes 👥
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg px-4">
          Administración y registro de la información de los clientes
        </p>
      </div>

      {/* 🔹 Botón de Nuevo Cliente */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200 text-center">
        <button
          onClick={() => {
            setEditCliente(null);
            setForm({ nombre: "", telefono: "", correo: "", direccion: "" });
            setShowModal(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold text-sm sm:text-base"
        >
          ➕ Registrar Nuevo Cliente
        </button>
      </div>

      {/* 🔹 Listado de Clientes */}
      <ClientesTable
        clientes={clientes}
        handleEditar={handleEditar}
        handleEliminar={handleEliminar}
        loading={loading}
      />

      {/* 🔹 Modal Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold mb-5 text-gray-800 border-b pb-2">
              {editCliente ? "✏️ Editar Cliente" : "➕ Nuevo Cliente"}
            </h3>

            <div className="space-y-3">
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre Completo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="Teléfono"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
              <input
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                placeholder="Correo Electrónico"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
              />
              <textarea
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Dirección Completa"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 h-20 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition font-semibold text-sm sm:text-base"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
