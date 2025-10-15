import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppContext } from "./contexts/AppContext";

import Navbar from "./components/layout/Navbar";
import PrivateRoute from "./components/auth/PrivateRoute";
import Login from "./components/auth/Login";

// 📂 Páginas principales
import DashboardHome from "./pages/DashboardHome";
import OrdersPage from "./pages/OrdersPage";
import InventoryPage from "./pages/InventoryPage";
import KanbanBoard from "./components/kanban/KanbanBoard";
import IncidenciasList from "./components/inventory/IncidenciasList";
import ParametrosPage from "./pages/ParametrosPage";
import ReportsPage from "./pages/ReportsPage";
import ClientesPage from "./pages/ClientesPage";

export default function App() {
  const { user } = useAppContext();

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* ✅ Navbar solo visible si el usuario está autenticado */}
        {user && <Navbar />}

        <main className="flex-1 p-4 sm:p-6">
          <Routes>
            {/* 🔹 Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 🔹 Login */}
            <Route path="/login" element={<Login />} />

            {/* 🧭 Supervisor */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <DashboardHome />
                </PrivateRoute>
              }
            />
            <Route
              path="/pedidos"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <OrdersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/reportes"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <ReportsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/parametros"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <ParametrosPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <ClientesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/incidencias"
              element={
                <PrivateRoute allowedRoles={["Supervisor"]}>
                  <IncidenciasList />
                </PrivateRoute>
              }
            />

            {/* 🧾 Inventario */}
            <Route
              path="/inventario"
              element={
                <PrivateRoute allowedRoles={["Inventario", "Supervisor"]}>
                  <InventoryPage />
                </PrivateRoute>
              }
            />

            {/* 🛠️ Operario */}
            <Route
              path="/kanban"
              element={
                <PrivateRoute allowedRoles={["Operario", "Supervisor"]}>
                  <KanbanBoard />
                </PrivateRoute>
              }
            />

            {/* 🔻 Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
