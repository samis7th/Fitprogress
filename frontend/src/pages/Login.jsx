import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

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
    <main className="app-bg flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="app-surface w-full max-w-sm rounded-2xl border p-6"
      >
        <h1 className="app-text text-center text-2xl font-semibold tracking-tight">FitProgress AI</h1>

        <div className="mt-8 space-y-4">
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
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <Link
          to="/register"
          className="app-muted mt-5 block text-center text-sm transition hover:text-emerald-500"
        >
          Criar conta
        </Link>
      </form>
    </main>
  );
}
