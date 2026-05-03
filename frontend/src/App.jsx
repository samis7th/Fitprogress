import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Dieta from "./pages/Dieta.jsx";
import Login from "./pages/Login.jsx";
import Metas from "./pages/Metas.jsx";
import Peso from "./pages/Peso.jsx";
import Register from "./pages/Register.jsx";
import Semana from "./pages/Semana.jsx";
import Treinos from "./pages/Treinos.jsx";
import { isAuthenticated } from "./services/auth.js";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/treinos"
        element={
          <ProtectedRoute>
            <Treinos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/semana"
        element={
          <ProtectedRoute>
            <Semana />
          </ProtectedRoute>
        }
      />
      <Route
        path="/peso"
        element={
          <ProtectedRoute>
            <Peso />
          </ProtectedRoute>
        }
      />
      <Route
        path="/metas"
        element={
          <ProtectedRoute>
            <Metas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dieta"
        element={
          <ProtectedRoute>
            <Dieta />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
