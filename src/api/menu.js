import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate } from "./mockDb";
import { seedWeeklyMenu, seedMeals, seedAddons, seedSettings } from "./seed";
import { getUpcomingDates, getCutoffTime, isDayClosed } from "@/lib/dates";

const readMenu = () => db.read("weeklyMenu", seedWeeklyMenu);
const readSettings = () => db.read("settings", seedSettings);

export const menuApi = {
  /** القالب الأسبوعي الثابت: { sun: [mealId], mon: [...], ... } */
  getWeekly: () => (USE_MOCK ? simulate(readMenu) : http("/menu/weekly")),
  saveWeekly: (menu) =>
    USE_MOCK ? simulate(() => db.write("weeklyMenu", menu)) : http("/admin/menu/weekly", { method: "PUT", body: menu }),

  getSettings: () => (USE_MOCK ? simulate(readSettings) : http("/settings")),
  saveSettings: (s) =>
    USE_MOCK ? simulate(() => db.write("settings", { ...readSettings(), ...s })) : http("/admin/settings", { method: "PUT", body: s }),

  /**
   * الـ 7 أيام الجاية (من بكره) مع وجباتها وإضافاتها.
   * الباك الحقيقي: GET /menu/upcoming بيرجع نفس الشكل بالظبط.
   */
  getUpcoming: () =>
    USE_MOCK
      ? simulate(() => {
          const menu = readMenu();
          const settings = readSettings();
          const meals = db.read("meals", seedMeals);
          const addons = db.read("addons", seedAddons);
          const now = new Date();
          return getUpcomingDates().map(({ date, dayKey, dayName }) => {
            const dayMeals = (menu[dayKey] || [])
              .map((id) => meals.find((m) => m.id === id))
              .filter((m) => m && m.isAvailable)
              .map((m) => ({ ...m, addons: m.addons.map((aid) => addons.find((a) => a.id === aid)).filter(Boolean) }));
            return {
              date, dayKey, dayName,
              meals: dayMeals,
              closesAt: getCutoffTime(date, settings.orderCutoffHour).toISOString(),
              isClosed: isDayClosed(date, settings.orderCutoffHour, now),
            };
          });
        })
      : http("/menu/upcoming"),
};
