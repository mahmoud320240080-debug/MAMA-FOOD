import { create } from "zustand";

/**
 * ستور واجهة المستخدم — حالة درور السلة المشتركة بين الناف بار والصفحات
 */
export const useUIStore = create((set) => ({
  cartDrawerOpen: false,
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  toggleCartDrawer: () => set((state) => ({ cartDrawerOpen: !state.cartDrawerOpen })),
}));
