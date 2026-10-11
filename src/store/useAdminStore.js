import { create } from "zustand";
import { persist } from "zustand/middleware";
import { tokenStorage } from "@/api/http";

export const useAdminStore = create(
  persist(
    (set) => ({
      adminToken: null,
      sidebarCollapsed: false,
      setToken: (token) => {
        tokenStorage.set(token);
        set({ adminToken: token });
      },
      clearToken: () => {
        tokenStorage.clear();
        set({ adminToken: null });
      },
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "mamafood:admin",
      partialize: (state) => ({
        adminToken: state.adminToken,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
