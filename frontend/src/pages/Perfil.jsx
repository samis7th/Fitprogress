import { useMemo, useRef, useState } from "react";

import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import Input from "../components/Input.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCurrentUser, updateUserProfile } from "../services/auth.js";

function getInitials(name = "Atleta") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const size = 420;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        const x = (size - width) / 2;
        const y = (size - height) / 2;

        canvas.width = size;
        canvas.height = size;
        context.drawImage(image, x, y, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      image.onerror = reject;
      image.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Perfil() {
  const { showToast } = useToast();
  const user = getCurrentUser();
  const metadata = user?.user_metadata || {};
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: metadata.name || "",
    phone: metadata.phone || "",
    goal: metadata.goal || "",
    height: metadata.height || "",
    bio: metadata.bio || "",
    avatar_url: metadata.avatar_url || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const displayName = form.name || user?.email?.split("@")[0] || "Atleta";
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no maximo 5MB.");
      return;
    }

    try {
      setError("");
      const avatar = await resizeImage(file);
      updateField("avatar_url", avatar);
    } catch {
      setError("Nao foi possivel processar a imagem.");
    } finally {
      event.target.value = "";
    }
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      await updateUserProfile({
        ...metadata,
        name: form.name.trim(),
        phone: form.phone.trim(),
        goal: form.goal.trim(),
        height: form.height ? Number(form.height) : null,
        bio: form.bio.trim(),
        avatar_url: form.avatar_url || null,
      });

      showToast({
        title: "Perfil atualizado",
        message: "Suas informacoes foram salvas.",
      });
    } catch (err) {
      const message =
        err.response?.data?.msg ||
        err.response?.data?.error_description ||
        err.message ||
        "Nao foi possivel atualizar o perfil.";
      setError(message);
      showToast({ title: "Erro ao salvar perfil", message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-500">
          Perfil
        </p>
        <h1 className="app-text mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Minha conta
        </h1>
        <p className="app-muted mt-2 max-w-2xl text-sm">
          Atualize sua foto e informacoes pessoais exibidas no FitProgress.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <h2 className="app-text text-lg font-semibold">Foto do perfil</h2>
          <p className="app-muted mt-1 text-sm">
            A imagem sera otimizada antes de salvar no seu perfil.
          </p>

          <div className="mt-6 flex flex-col items-center text-center">
            <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-[2rem] border border-[var(--border-strong)] bg-emerald-500 text-3xl font-bold text-[var(--accent-contrast)] shadow-[var(--shadow-soft)]">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="Foto do perfil"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="mt-5 grid w-full gap-2">
              <Button type="button" onClick={() => fileInputRef.current?.click()}>
                Alterar foto
              </Button>
              {form.avatar_url && (
                <Button type="button" variant="secondary" onClick={() => updateField("avatar_url", "")}>
                  Remover foto
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="app-text text-lg font-semibold">Informacoes pessoais</h2>
          <p className="app-muted mt-1 text-sm">
            Esses dados ajudam a personalizar a experiencia.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Nome"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Seu nome"
              />
              <Input label="Email" value={user?.email || ""} disabled />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Telefone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="Opcional"
              />
              <Input
                label="Altura"
                type="number"
                step="1"
                value={form.height}
                onChange={(event) => updateField("height", event.target.value)}
                placeholder="cm"
              />
              <Input
                label="Objetivo"
                value={form.goal}
                onChange={(event) => updateField("goal", event.target.value)}
                placeholder="Hipertrofia, força..."
              />
            </div>

            <label className="block">
              <span className="app-label mb-2 block text-sm font-semibold">Sobre voce</span>
              <textarea
                className="app-control min-h-28 w-full resize-y px-3.5 py-2.5 text-sm placeholder:text-gray-500"
                placeholder="Ex: treino 5x por semana, foco em evoluir cargas..."
                value={form.bio}
                onChange={(event) => updateField("bio", event.target.value)}
                maxLength={500}
              />
            </label>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar perfil"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
