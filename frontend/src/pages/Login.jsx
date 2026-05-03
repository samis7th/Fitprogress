import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { isAuthenticated, login } from "../services/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.error_description || "Login inválido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Acesse sua conta"
      subtitle="Entre para acompanhar seus treinos, metas e evolução em um só lugar."
      error={error}
      onSubmit={handleSubmit}
      submit={
        <Button type="submit" className="w-full rounded-xl py-3" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      }
      footer={
        <Link
          to="/register"
          className="font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          Criar nova conta
        </Link>
      }
    >
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="seu@email.com"
        required
      />
      <Input
        label="Senha"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Sua senha"
        required
      />
    </AuthShell>
  );
}
