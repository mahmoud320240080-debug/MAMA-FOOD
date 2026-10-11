import { create } from "zustand";
import { menuApi, mealsApi } from "@/api";

export const useAdminMenuStore = create((set, get) => ({
  meals: [],
  weeklyMenu: {
    sun: [],
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
  },
  isLoading: false,
  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [mealsData, menuData] = await Promise.all([
        mealsApi.list(),
        menuApi.getWeeklyMenu(),
      ]);
      set({
        meals: mealsData || [],
        weeklyMenu: menuData || {
          sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [],
        },
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.message || "حدث خطأ أثناء تحميل البيانات", isLoading: false });
    }
  },

  setMeals: (meals) => set({ meals }),
  setWeeklyMenu: (weeklyMenu) => set({ weeklyMenu }),

  addMealToDay: async (dayKey, mealId) => {
    const current = get().weeklyMenu;
    const dayMeals = current[dayKey] || [];
    if (dayMeals.includes(mealId)) return; // already exists in that day

    const updated = {
      ...current,
      [dayKey]: [...dayMeals, mealId],
    };
    set({ weeklyMenu: updated });
    await menuApi.updateWeeklyMenu(updated);
  },

  removeMealFromDay: async (dayKey, mealId) => {
    const current = get().weeklyMenu;
    const dayMeals = current[dayKey] || [];
    const updated = {
      ...current,
      [dayKey]: dayMeals.filter((id) => id !== mealId),
    };
    set({ weeklyMenu: updated });
    await menuApi.updateWeeklyMenu(updated);
  },

  copyDayToDay: async (fromDayKey, toDayKey) => {
    const current = get().weeklyMenu;
    const sourceMeals = current[fromDayKey] || [];
    const updated = {
      ...current,
      [toDayKey]: [...sourceMeals],
    };
    set({ weeklyMenu: updated });
    await menuApi.updateWeeklyMenu(updated);
  },
}));
