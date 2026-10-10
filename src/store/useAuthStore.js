import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/api/http";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: ({ token, user }) => { tokenStorage.set(token); set({ token, user }); },
      logout: () => { tokenStorage.clear(); set({ token: null, user: null }); },
    }),
    { name: "mamafood:auth" }
  )
);
