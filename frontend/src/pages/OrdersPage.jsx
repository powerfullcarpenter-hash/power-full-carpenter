// /frontend/src/pages/OrdersPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderForm from "../components/orders/OrderForm";
import OrderList from "../components/orders/OrderList";

export default function OrdersPage() {
  const [refresh, setRefresh] = useState(false);
  const navigate = useNavigate();

  const reload = () => setRefresh((prev) => !prev);

  return (
    <div className="p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* 🔹 Encabezado */}
      <div className="flex flex-col items-center relative mb-6 text-center">
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute left-2 sm:left-0 top-0 sm:top-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          ← Ir al Dashboard
        </button>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-800 mt-12 sm:mt-0">
          Gestión de Pedidos
        </h1>
        <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg px-4">
          Crea y administra pedidos activos en el sistema
        </p>
      </div>

      {/* 🔹 Formulario de nuevo pedido */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200">
        <OrderForm onOrderCreated={reload} />
      </div>

      {/* 🔹 Listado de pedidos */}
      <div className="bg-white rounded-xl shadow p-4 sm:p-6 border border-gray-200 overflow-x-auto">
        <OrderList refresh={refresh} />
      </div>
    </div>
  );
}
