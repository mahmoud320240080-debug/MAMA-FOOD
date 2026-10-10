import { create } from "zustand";

let n = 0;
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (type, message, ms = 3200) => {
    const id = ++n;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = {
  success: (m) => useToastStore.getState().push("success", m),
  error: (m) => useToastStore.getState().push("error", m),
  info: (m) => useToastStore.getState().push("info", m),
};
