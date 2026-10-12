import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate } from "./mockDb";
import { seedWeeklyMenu, seedMeals, seedAddons, seedSettings, defaultDeliveryArea, DEFAULT_DELIVERY_FEE } from "./seed";
import { UPCOMING_DAYS_COUNT } from "@/lib/constants";
import { getDayLockTime, getToday, getUpcomingDates, isDayLocked } from "@/lib/dates";
import { validatePaymentSettings } from "@/lib/payments";
import { cleanDeliveryAreas, deliveryAreasError } from "@/lib/delivery";

const readMenu = () => db.read("weeklyMenu", seedWeeklyMenu);

/**
 * إعدادات الموك (الطلبات والمنيو بيقروا منها). ترحيل التثبيتات القديمة:
 * - مفيش cutoffMode = القاعدة القديمة (orderCutoffHour كان ساعة اليوم اللي قبله، 22 مثلاً)،
 *   فبناخد الافتراضي الجديد (نفس اليوم الساعة 12) بدل ما نقرا 22 كساعة في نفس اليوم.
 * - مفيش payments (أو ناقص منها حاجة) = الافتراضي: الدفع الإلكتروني مقفول ومن غير أرقام.
 * - مفيش deliveryAreas = نسخة الرسوم الواحدة القديمة: منطقة واحدة "كل المناطق" مفعّلة بنفس الرسوم القديمة
 *   (deliveryFee، أو الافتراضي لو مش موجودة) — وdeliveryFee بيتشال، ومبقاش بيتقري غير هنا.
 * ميعاد القفل وباقي الإعدادات المتخزنة بيفضلوا زي ما هم.
 */
export const readSettings = () => {
  const stored = db.read("settings", seedSettings);
  const seed = seedSettings();
  const lock = stored.cutoffMode ? {} : { cutoffMode: seed.cutoffMode, orderCutoffHour: seed.orderCutoffHour };
  const p = stored.payments || {};
  const payments = {
    ...seed.payments,
    ...p,
    vodafoneCash: { ...seed.payments.vodafoneCash, ...p.vodafoneCash },
    instapay: { ...seed.payments.instapay, ...p.instapay },
  };
  // ترحيل بس: deliveryFee القديمة بتتحول لسعر المنطقة الوحيدة
  const { deliveryFee: legacyFee, ...rest } = stored;
  const deliveryAreas = Array.isArray(stored.deliveryAreas)
    ? stored.deliveryAreas
    : [defaultDeliveryArea(legacyFee == null || !Number.isFinite(Number(legacyFee)) ? DEFAULT_DELIVERY_FEE : Number(legacyFee))];
  const next = { ...rest, ...lock, payments, deliveryAreas };
  return JSON.stringify(next) === JSON.stringify(stored) ? stored : db.write("settings", next);
};

/** تنضيف إعدادات الدفع قبل الحفظ (trim) + نفس التحقق اللي في صفحة الإعدادات */
const cleanPayments = (payments) => {
  const trim = (v) => String(v ?? "").trim();
  const clean = {
    vodafoneCash: { enabled: !!payments.vodafoneCash?.enabled, number: trim(payments.vodafoneCash?.number), accountName: trim(payments.vodafoneCash?.accountName) },
    instapay: { enabled: !!payments.instapay?.enabled, handle: trim(payments.instapay?.handle), accountName: trim(payments.instapay?.accountName) },
    instructions: trim(payments.instructions),
  };
  const errors = Object.values(validatePaymentSettings(clean));
  if (errors.length) throw new Error(errors[0]);
  return clean;
};

/** تنضيف مناطق التوصيل قبل الحفظ + نفس التحقق اللي في صفحة الإعدادات */
const cleanAreas = (areas) => {
  const clean = cleanDeliveryAreas(areas);
  const error = deliveryAreasError(clean);
  if (error) throw new Error(error);
  return clean;
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
    USE_MOCK
      ? simulate(() => db.write("settings", {
          ...readSettings(),
          ...s,
          ...(s.payments ? { payments: cleanPayments(s.payments) } : {}),
          ...(s.deliveryAreas ? { deliveryAreas: cleanAreas(s.deliveryAreas) } : {}),
        }))
      : http("/admin/settings", { method: "PUT", body: s }),

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
