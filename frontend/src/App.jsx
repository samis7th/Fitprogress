import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Layout from "./layout/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Dieta from "./pages/Dieta.jsx";
import Login from "./pages/Login.jsx";
import Metas from "./pages/Metas.jsx";
import Perfil from "./pages/Perfil.jsx";
import Peso from "./pages/Peso.jsx";
import Register from "./pages/Register.jsx";
import Semana from "./pages/Semana.jsx";
import Treinos from "./pages/Treinos.jsx";
import { isAuthenticated } from "./services/auth.js";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/treinos" element={<Treinos />} />
          <Route path="/semana" element={<Semana />} />
          <Route path="/peso" element={<Peso />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/dieta" element={<Dieta />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
