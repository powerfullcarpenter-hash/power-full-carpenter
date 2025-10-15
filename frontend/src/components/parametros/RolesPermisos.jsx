import { useEffect, useState } from "react";
import {
  getUsers,
  addUser,
  updateUserRole,
  deleteUser,
  toggleUserActive,
} from "../../api/users";

export default function RolesPermisos() {
  const [usuarios, setUsuarios] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  // 🔹 Cargar usuarios
  const loadData = async () => {
    try {
      const data = await getUsers();
      setUsuarios(data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔹 Abrir modal (nuevo o editar)
  const handleOpenModal = (user = null) => {
    if (user) {
      setEditando(user.user_id);
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
      });
    } else {
      setEditando(null);
      setForm({ name: "", email: "", password: "", role: "" });
    }
    setShowModal(true);
  };

  // 🔹 Cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Guardar cambios o agregar usuario
  const handleSubmit = async () => {
    try {
      if (editando) {
        await updateUserRole(editando, form.role);
      } else {
        await addUser(form);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Error guardando usuario:", err);
      alert("No se pudo guardar el usuario.");
    }
  };

  // 🔹 Eliminar usuario
  const handleDeleteClick = (id) => {
    setUserIdToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowConfirmModal(false);
    try {
      await deleteUser(userIdToDelete);
      loadData();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      if (error.response && error.response.status === 500) {
        setErrorMessage(
          "❌ No se puede eliminar: el usuario tiene movimientos registrados en el sistema."
        );
      } else {
        setErrorMessage("⚠️ Ocurrió un error inesperado al eliminar el usuario.");
      }
      setShowErrorModal(true);
    }
  };

  // 🔹 Modal de error
  const ErrorModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[420px]">
        <h3 className="text-lg font-bold text-red-600 mb-3">⚠️ Error</h3>
        <p className="text-gray-700 mb-4">{errorMessage}</p>
        <div className="flex justify-end">
          <button
            onClick={() => setShowErrorModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  // 🔹 Modal de confirmación
  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[420px]">
        <h3 className="text-lg font-extrabold text-gray-800 mb-3">
          🗑️ Confirmar Eliminación
        </h3>
        <p className="text-gray-700 mb-4 leading-relaxed">
          ¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowConfirmModal(false)}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
      {/* 🔹 Título */}
      <h3 className="text-2xl font-extrabold text-gray-800 flex items-center">
        👥 Gestión de Roles y Permisos
      </h3>

      {/* 🔹 Botón agregar */}
      <button
        onClick={() => handleOpenModal()}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition font-medium shadow-sm"
      >
        ➕ Agregar Usuario
      </button>

      {/* 🔹 Tabla */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full border-collapse text-sm text-gray-700">
          <thead className="bg-gray-100 text-gray-700 font-semibold">
            <tr>
              <th className="px-3 py-2 border text-left">Usuario</th>
              <th className="px-3 py-2 border text-left">Correo</th>
              <th className="px-3 py-2 border text-center">Rol</th>
              <th className="px-3 py-2 border text-center">Estado</th>
              <th className="px-3 py-2 border text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, idx) => (
              <tr
                key={u.user_id}
                className={`${
                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="border px-3 py-2">{u.name}</td>
                <td className="border px-3 py-2">{u.email}</td>
                <td className="border px-3 py-2 text-center font-medium">
                  {u.role}
                </td>
                <td className="border px-3 py-2 text-center">
                  {u.activo ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-300 font-semibold">
                      ✅ Activo
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-300 font-semibold">
                      🔒 Inactivo
                    </span>
                  )}
                </td>
                <td className="border px-3 py-2 text-center space-x-2">
                  <button
                    onClick={() => handleOpenModal(u)}
                    className="bg-yellow-100 text-yellow-700 border border-yellow-300 px-3 py-1 rounded hover:bg-yellow-200 transition"
                  >
                    ✏️ Rol
                  </button>
                  <button
                    onClick={() => handleDeleteClick(u.user_id)}
                    className="bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded hover:bg-red-200 transition"
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={async () => {
                      await toggleUserActive(u.user_id, !u.activo);
                      loadData();
                    }}
                    className={`${
                      u.activo
                        ? "bg-gray-500 hover:bg-gray-600"
                        : "bg-green-500 hover:bg-green-600"
                    } text-white px-3 py-1 rounded transition`}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-5 text-gray-500 italic">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Modal de agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xl w-full max-w-md animate-fade-in-down border border-gray-100 relative">
            {/* Cerrar */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            {/* Título */}
            <h3 className="text-xl font-extrabold text-gray-800 mb-5">
              {editando ? "✏️ Editar Usuario" : "➕ Nuevo Usuario"}
            </h3>

            {/* Formulario */}
            <div className="space-y-3">
              {!editando && (
                <>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nombre completo"
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Correo electrónico"
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Contraseña"
                    className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </>
              )}

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Selecciona un rol --</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Inventario">Inventario</option>
                <option value="Operario">Operario</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex justify-end mt-6 gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-medium shadow-sm"
              >
                {editando ? "Guardar Cambios" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modales de error y confirmación */}
      {showErrorModal && <ErrorModal />}
      {showConfirmModal && <DeleteConfirmationModal />}
    </div>
  );
}
