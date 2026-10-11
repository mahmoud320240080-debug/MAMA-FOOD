import { create } from "zustand";

let n = 0;
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (type, message, opts = {}) => {
    const id = ++n;
    const ms = typeof opts === "number" ? opts : (opts?.ms ?? 3500);
    const action = opts?.action ?? null;
    set({ toasts: [...get().toasts, { id, type, message, action }] });
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m, opts) => useToastStore.getState().push("success", m, opts),
  error: (m, opts) => useToastStore.getState().push("error", m, opts),
  info: (m, opts) => useToastStore.getState().push("info", m, opts),
};

