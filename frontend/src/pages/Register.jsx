import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthShell from "../components/AuthShell.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { isAuthenticated, register } from "../services/auth.js";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
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
      await register(name, email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.error_description || "Não foi possível criar a conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Organize sua rotina e acompanhe sua evolução com uma experiência limpa."
      error={error}
      onSubmit={handleSubmit}
      submit={
        <Button type="submit" className="w-full rounded-xl py-3" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </Button>
      }
      footer={
        <Link
          to="/login"
          className="font-semibold text-emerald-400 transition hover:text-emerald-300"
        >
          Já tenho conta
        </Link>
      }
    >
      <Input
        label="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Seu nome"
        required
      />
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
        placeholder="Mínimo 6 caracteres"
        required
      />
    </AuthShell>
  );
}
