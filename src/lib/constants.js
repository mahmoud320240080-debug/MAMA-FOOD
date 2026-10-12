export const BRAND = { name: "MAMA FOOD", tagline: "Home Made Food", taglineAr: "أكل بيتي" };

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // مطابق لـ Date.getDay()

export const DAY_NAMES_AR = {
  sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء", wed: "الأربعاء",
  thu: "الخميس", fri: "الجمعة", sat: "السبت",
};

// badge: ألوان البادج (ممنوع أصفر على أبيض/كريمي — الأصفر خلفية بس والكلام بني)
export const ORDER_STATUS = {
  new: { label: "جديد", tone: "red", badge: "bg-brand-red text-white" },
  preparing: { label: "بيتحضر", tone: "yellow", badge: "bg-brand-yellow text-ink" },
  delivering: { label: "في الطريق", tone: "blue", badge: "bg-blue-100 text-blue-800" },
  done: { label: "تم التسليم", tone: "green", badge: "bg-green-100 text-green-800" },
  cancelled: { label: "ملغي", tone: "gray", badge: "bg-ink/10 text-ink-soft" },
};
export const ORDER_STATUS_FLOW = ["new", "preparing", "delivering", "done"];

/** الحالات المسموح الانتقال لها: الخطوة الجاية في الـ flow + "ملغي" من أي حالة قبل "تم" */
export const nextOrderStatuses = (status) => {
  if (status === "done" || status === "cancelled") return [];
  const next = ORDER_STATUS_FLOW[ORDER_STATUS_FLOW.indexOf(status) + 1];
  return [next, "cancelled"].filter(Boolean);
};
export const canChangeOrderStatus = (from, to) => nextOrderStatuses(from).includes(to);

export const MEAL_CATEGORIES = {
  main: "أطباق رئيسية", rice: "أرز ومكرونة", stuffed: "محشي", grill: "مشويات", dessert: "حلويات",
};

export const UPCOMING_DAYS_COUNT = 7; // 7 أيام تبدأ من بكره (والنهارده قبلهم)

/** وضع قفل الطلبات (settings.cutoffMode) — الحساب نفسه في getDayLockTime */
export const CUTOFF_MODES = { same_day: "نفس اليوم", day_before: "اليوم اللي قبله" };
export const PHONE_REGEX = /^01[0125][0-9]{8}$/; // موبايل مصري

/** طرق الدفع (order.paymentMethod). short = نسخة مختصرة للشرايح الصغيرة */
export const PAYMENT_METHODS = {
  cash: { label: "كاش عند الاستلام", short: "كاش" },
  vodafone_cash: { label: "فودافون كاش", short: "فودافون كاش" },
  instapay: { label: "إنستاباي", short: "إنستاباي" },
};

/**
 * حالة الدفع (order.payment.status). badge على نفس نظام ORDER_STATUS (ممنوع أصفر على فاتح: الأصفر خلفية والكلام بني)
 * not_required محايد (كاش) · confirmed = الإيصال وصل مع الطلب (مفيش مراجعة من الأدمن)
 */
export const PAYMENT_STATUS = {
  not_required: { label: "كاش عند الاستلام", short: "كاش", badge: "bg-ink/10 text-ink" },
  confirmed: { label: "وصل الإيصال", short: "وصل الإيصال", badge: "bg-green-100 text-green-800" },
};
