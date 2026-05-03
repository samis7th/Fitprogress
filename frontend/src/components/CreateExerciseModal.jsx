import { useState } from "react";

import Button from "./Button.jsx";
import Input from "./Input.jsx";
import Select from "./Select.jsx";

export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Perna",
  "Posterior",
  "Glúteo",
  "Ombro",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Panturrilha",
  "Cardio",
  "Funcional",
  "Avançado",
];

export const EXERCISE_CATEGORIES = ["halter", "máquina", "peso corporal"];

export default function CreateExerciseModal({ initialName, initialGroup, onClose, onCreate }) {
  const [form, setForm] = useState({
    nome: initialName,
    grupo: initialGroup || "Peito",
    categoria: "halter",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      await onCreate(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 px-4">
      <form onSubmit={handleSubmit} className="app-surface app-border w-full max-w-md rounded-2xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="app-text text-lg font-semibold">Criar exercício</h2>
            <p className="app-muted mt-1 text-sm">Adicione um exercício personalizado.</p>
          </div>
          <button type="button" onClick={onClose} className="app-muted hover:text-emerald-500">
            Fechar
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            label="Nome"
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            required
          />

          <Select
            label="Grupo"
            options={MUSCLE_GROUPS}
            value={form.grupo}
            onChange={(grupo) => setForm({ ...form, grupo })}
          />

          <Select
            label="Categoria"
            options={EXERCISE_CATEGORIES}
            value={form.categoria}
            onChange={(categoria) => setForm({ ...form, categoria })}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar exercício"}
          </Button>
        </div>
      </form>
    </div>
  );
}
