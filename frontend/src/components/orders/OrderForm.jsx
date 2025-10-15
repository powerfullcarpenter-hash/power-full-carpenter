import { useState, useEffect } from "react";
import { createOrder } from "../../api/orders";
import { getOperarios } from "../../api/users";
import { getParametros } from "../../api/parametros";
import { getClientes, addCliente } from "../../api/clientes";

export default function OrderForm({ onOrderCreated }) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    direccion: "",
  });

  const [prioridad, setPrioridad] = useState("Normal");
  const [descripcion, setDescripcion] = useState("");
  const [area, setArea] = useState("");
  const [asignadoA, setAsignadoA] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [operarios, setOperarios] = useState([]);
  const [paramAreas, setParamAreas] = useState([]);
  const [paramPrioridades, setParamPrioridades] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Carga inicial de datos dinámicos
  useEffect(() => {
    (async () => {
      try {
        const [ops, areas, prioridades, cls] = await Promise.all([
          getOperarios(),
          getParametros("area"),
          getParametros("prioridad"),
          getClientes(),
        ]);
        setOperarios(ops);
        setParamAreas(areas);
        setParamPrioridades(prioridades);
        setClientes(cls);
      } catch (e) {
        console.error("Error cargando datos dinámicos", e);
      }
    })();
  }, []);

  // 🔹 Crear cliente nuevo
  const handleCrearCliente = async () => {
    if (!nuevoCliente.nombre.trim()) return alert("El nombre es obligatorio");
    try {
      const cliente = await addCliente(nuevoCliente);
      setClienteId(cliente.cliente_id);
      setNombreCliente(cliente.nombre);
      setNuevoCliente({ nombre: "", telefono: "", correo: "", direccion: "" });
      setShowNuevoCliente(false);
      setClientes(await getClientes()); // refrescar lista
    } catch (err) {
      alert(err.response?.data?.error || "Error registrando cliente");
    }
  };

  // 🔹 Crear pedido
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!asignadoA) {
      setLoading(false);
      return setError("Debes asignar un operario");
    }
    if (!area) {
      setLoading(false);
      return setError("Debes seleccionar un área");
    }

    try {
      await createOrder({
        cliente_id: clienteId || null,
        nombre_cliente:
          nombreCliente ||
          clientes.find((c) => c.cliente_id === Number(clienteId))?.nombre ||
          "",
        area,
        prioridad,
        descripcion,
        asignado_a: Number(asignadoA),
        fecha_compromiso: fechaCompromiso || null,
      });

      // Resetear formulario
      setClienteId("");
      setNombreCliente("");
      setPrioridad("Normal");
      setDescripcion("");
      setArea("");
      setAsignadoA("");
      setFechaCompromiso("");
      setError("");
      if (onOrderCreated) onOrderCreated();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Error creando pedido"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-5"
    >
      <h2 className="text-2xl font-extrabold text-gray-800 flex items-center">
        📋 Nuevo Pedido
      </h2>
      {error && (
        <p className="text-red-600 text-sm border border-red-200 bg-red-50 p-2 rounded-md">
          ⚠️ {error}
        </p>
      )}

      {/* 🧍 Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cliente
        </label>
        <select
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value);
            setNombreCliente("");
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona un cliente...</option>
          {clientes.map((c) => (
            <option key={c.cliente_id} value={c.cliente_id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setShowNuevoCliente(true)}
          className="mt-2 text-blue-600 hover:underline text-sm"
        >
          ➕ Nuevo Cliente
        </button>
      </div>

      {/* 🪟 Modal Nuevo Cliente */}
      {showNuevoCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="font-semibold mb-3 text-gray-800 text-lg">
              ➕ Registrar Cliente
            </h3>
            <div className="space-y-2">
              <input
                value={nuevoCliente.nombre}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Nombre del cliente"
              />
              <input
                value={nuevoCliente.telefono}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Teléfono"
              />
              <input
                type="email"
                value={nuevoCliente.correo}
                onChange={(e) =>
                  setNuevoCliente({ ...nuevoCliente, correo: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Correo electrónico"
              />
              <textarea
                value={nuevoCliente.direccion}
                onChange={(e) =>
                  setNuevoCliente({
                    ...nuevoCliente,
                    direccion: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                placeholder="Dirección"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowNuevoCliente(false)}
                className="px-3 py-1 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearCliente}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción del pedido
        </label>
        <textarea
          placeholder="Ejemplo: Fabricación de mesa vintage..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 📅 Fecha compromiso */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fecha de Compromiso
        </label>
        <input
          type="date"
          value={fechaCompromiso}
          onChange={(e) => setFechaCompromiso(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ⚡ Prioridad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Prioridad
        </label>
        <select
          value={prioridad}
          onChange={(e) => setPrioridad(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          {paramPrioridades.map((p, idx) => (
            <option key={idx} value={p.valor}>
              {p.valor}
            </option>
          ))}
        </select>
      </div>

      {/* 🏭 Área */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona un área</option>
          {paramAreas.map((a, idx) => (
            <option key={idx} value={a.valor}>
              {a.valor}
            </option>
          ))}
        </select>
      </div>

      {/* 👷 Operario */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Operario Asignado
        </label>
        <select
          value={asignadoA}
          onChange={(e) => setAsignadoA(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Selecciona un operario</option>
          {operarios.map((o) => (
            <option key={o.user_id} value={o.user_id}>
              {o.name} ({o.email})
            </option>
          ))}
        </select>
      </div>

      {/* 🚀 Botón Crear */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-50"
        >
          {loading ? "Creando..." : "➕ Crear Pedido"}
        </button>
      </div>
    </form>
  );
}
