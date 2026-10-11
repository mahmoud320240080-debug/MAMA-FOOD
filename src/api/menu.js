import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate } from "./mockDb";
import { seedWeeklyMenu, seedMeals, seedAddons, seedSettings } from "./seed";
import { UPCOMING_DAYS_COUNT } from "@/lib/constants";
import { getDayLockTime, getToday, getUpcomingDates, isDayLocked } from "@/lib/dates";

const readMenu = () => db.read("weeklyMenu", seedWeeklyMenu);

/**
 * إعدادات الموك (الطلبات والمنيو بيقروا منها). ترحيل التثبيتات القديمة:
 * مفيش cutoffMode = القاعدة القديمة (orderCutoffHour كان ساعة اليوم اللي قبله، 22 مثلاً)،
 * فبناخد الافتراضي الجديد (نفس اليوم الساعة 12) بدل ما نقرا 22 كساعة في نفس اليوم. رسوم التوصيل بتفضل زي ما هي.
 */
export const readSettings = () => {
  const stored = db.read("settings", seedSettings);
  if (stored.cutoffMode) return stored;
  const { cutoffMode, orderCutoffHour } = seedSettings();
  return db.write("settings", { ...stored, cutoffMode, orderCutoffHour });
};

export const menuApi = {
  /** القالب الأسبوعي الثابت: { sun: [mealId], mon: [...], ... } */
  getWeekly: () => (USE_MOCK ? simulate(readMenu) : http("/menu/weekly")),
  getWeeklyMenu: () => (USE_MOCK ? simulate(readMenu) : http("/menu/weekly")),
  saveWeekly: (menu) =>
    USE_MOCK ? simulate(() => db.write("weeklyMenu", menu)) : http("/admin/menu/weekly", { method: "PUT", body: menu }),
  updateWeeklyMenu: (menu) =>
    USE_MOCK ? simulate(() => db.write("weeklyMenu", menu)) : http("/admin/menu/weekly", { method: "PUT", body: menu }),

  getSettings: () => (USE_MOCK ? simulate(readSettings) : http("/settings")),
  saveSettings: (s) =>
    USE_MOCK ? simulate(() => db.write("settings", { ...readSettings(), ...s })) : http("/admin/settings", { method: "PUT", body: s }),

  /**
   * النهارده + الـ 7 أيام الجاية (من بكره) مع وجباتها وإضافاتها وميعاد قفلها.
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
          return [getToday(now), ...getUpcomingDates(UPCOMING_DAYS_COUNT, now)].map(({ date, dayKey, dayName }, i) => {
            const dayMeals = (menu[dayKey] || [])
              .map((id) => meals.find((m) => m.id === id))
              .filter((m) => m && m.isAvailable)
              .map((m) => ({ ...m, addons: m.addons.map((aid) => addons.find((a) => a.id === aid)).filter(Boolean) }));
            return {
              date, dayKey, dayName,
              isToday: i === 0,
              meals: dayMeals,
              closesAt: getDayLockTime(date, settings).toISOString(),
              isClosed: isDayLocked(date, now, settings),
            };
          });
        })
      : http("/menu/upcoming"),
};
