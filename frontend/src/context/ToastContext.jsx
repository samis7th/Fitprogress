import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function createToastId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = "success" }) => {
      const id = createToastId();
      setToasts((current) => [...current, { id, title, message, type }]);
      window.setTimeout(() => removeToast(id), 3500);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] w-[calc(100%-2rem)] max-w-sm space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`app-surface app-border rounded-xl border p-4 shadow-lg ${
              toast.type === "error" ? "border-red-500/30" : "border-emerald-500/30"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="app-text text-sm font-semibold">{toast.title}</p>
                {toast.message && <p className="app-muted mt-1 text-sm">{toast.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="app-muted text-sm hover:text-emerald-500"
              >
                Fechar
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }

  return context;
}
