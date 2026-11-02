import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon";
import styles from "./Toast.module.css";

interface ToastOptions {
  message: string;
  tone?: "default" | "error";
  action?: { label: string; onClick: () => void };
  /** Milliseconds before the toast hides. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

/** Bottom-left toasts announced through a polite live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { ...options, id }]);
      window.setTimeout(() => dismiss(id), options.duration ?? 5000);
    },
    [dismiss]
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Portalled and excluded from the drawer's inert overlay so Undo stays usable. */}
      {createPortal(
      <div className={styles.region} role="status" aria-live="polite" data-bh-toasts="">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${toast.tone === "error" ? styles.error : ""}`}>
            <Icon name={toast.tone === "error" ? "alert" : "check"} size={16} />
            <span className={styles.message}>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>,
      document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
