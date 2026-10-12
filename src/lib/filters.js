import { normalizeSearch } from "./search";
import { isElectronicPayment } from "./payments";

/**
 * فلترة وترتيب قوايم الأدمن — دوال pure (من غير React) عشان تتجرّب لوحدها.
 * البحث بتطبيع العربي المشترك (normalizeSearch): أ/إ/ا، ة/ه، التشكيل، الحروف الكبيرة/الصغيرة.
 */

/** أرقام عربية/فارسي => إنجليزي (١٠٠١ => 1001) */
export const toLatinDigits = (s = "") =>
  String(s).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

/** query بحث جاهز: نص مطبّع (من غير #) + أرقام بس لو الكلام كله أرقام (للموبايل ورقم الطلب، والمسافات والشرط مش فارقة) */
const prepareQuery = (q) => {
  const text = normalizeSearch(toLatinDigits(q)).replace(/^#/, "").trim();
  const compact = text.replace(/[\s-]/g, "");
  return { text, digits: /^\d+$/.test(compact) ? compact : "" };
};

const includesText = (query, value) => normalizeSearch(value ?? "").includes(query);

// ───────────── الطلبات ─────────────

/** قيمة فلتر المنطقة للطلبات القديمة اللي من غير منطقة */
export const NO_AREA = "none";

export const ORDER_SORTS = { newest: "الأحدث", oldest: "الأقدم", highest: "الأعلى قيمة" };
export const ORDER_CREATED = { today: "النهارده", week: "آخر 7 أيام" };

/** رقم الطلب (بـ # أو من غيرها) أو اسم العميل أو الموبايل (بأي أرقام ومسافات) أو اسم المنطقة */
export const orderMatchesQuery = (order, q) => {
  const { text, digits } = prepareQuery(q);
  if (!text) return true;
  if (digits && (String(order.orderNumber).includes(digits) || toLatinDigits(order.customer?.phone).replace(/[\s-]/g, "").includes(digits))) return true;
  return includesText(text, order.customer?.name) || includesText(text, order.deliveryArea?.name) || String(order.orderNumber).includes(text);
};

/** فلتر الدفع: "cash" = طلبات الكاش، غير كده = حالة دفع طلب إلكتروني */
const matchesPayment = (o, payment) =>
  payment === "cash" ? !isElectronicPayment(o.paymentMethod) : isElectronicPayment(o.paymentMethod) && o.payment?.status === payment;

/** بداية يوم الطلب الأقدم المسموح بيه في فلتر "اتعمل إمتى" (بتوقيت الجهاز) */
const createdSince = (created, now) => {
  const days = created === "today" ? 0 : created === "week" ? 6 : null;
  return days == null ? null : new Date(now.getFullYear(), now.getMonth(), now.getDate() - days).getTime();
};

const ORDER_COMPARE = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
  highest: (a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0) || b.createdAt.localeCompare(a.createdAt),
};

/**
 * فلترة الطلبات (نفس منطق GET /admin/orders على الباك):
 * q | status | date: يوم مطلوب في الطلب | payment: cash أو حالة دفع | area: id المنطقة أو NO_AREA
 * created: today / week (تاريخ عمل الطلب) | sort: newest (الافتراضي) / oldest / highest
 */
export const filterOrders = (orders, { q, status, date, payment, area, created, sort } = {}, now = new Date()) => {
  const since = createdSince(created, now);
  return orders
    .filter((o) => !status || o.status === status)
    .filter((o) => !payment || matchesPayment(o, payment))
    .filter((o) => !date || o.items.some((it) => it.date === date))
    .filter((o) => !area || (area === NO_AREA ? !o.deliveryArea : o.deliveryArea?.id === area))
    .filter((o) => since == null || new Date(o.createdAt).getTime() >= since)
    .filter((o) => orderMatchesQuery(o, q))
    .sort(ORDER_COMPARE[sort] || ORDER_COMPARE.newest);
};

/** المناطق اللي ظاهرة في الطلبات (باسمها في أحدث طلب) + "من غير منطقة" لو فيه طلبات قديمة من غيرها */
export const orderAreaOptions = (orders) => {
  const byId = new Map();
  let hasNone = false;
  for (const o of [...orders].sort(ORDER_COMPARE.oldest)) {
    if (o.deliveryArea?.id) byId.set(o.deliveryArea.id, o.deliveryArea.name);
    else hasNone = true;
  }
  const options = [...byId].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "ar"));
  return hasNone ? [...options, { value: NO_AREA, label: "من غير منطقة" }] : options;
};

// ───────────── الوجبات ─────────────

export const MEAL_AVAILABILITY = { available: "متاحة", unavailable: "غير متاحة" };

/** q: الاسم أو الوصف | category | availability: available / unavailable */
export const filterMeals = (meals, { q, category, availability } = {}) => {
  const { text } = prepareQuery(q);
  return meals.filter((m) =>
    (!category || m.category === category)
    && (!availability || (availability === "available" ? m.isAvailable : !m.isAvailable))
    && (!text || includesText(text, m.name) || includesText(text, m.description)));
};

/** الأقسام اللي فيها وجبات فعلاً (بترتيب labels) */
export const mealCategoryOptions = (meals, labels) => {
  const present = new Set(meals.map((m) => m.category).filter(Boolean));
  return Object.entries(labels).filter(([value]) => present.has(value)).map(([value, label]) => ({ value, label }));
};

// ───────────── الإضافات ─────────────

export const ADDON_PRICES = { free: "مجانية", paid: "بسعر" };

/** q: الاسم | price: free / paid */
export const filterAddons = (addons, { q, price } = {}) => {
  const { text } = prepareQuery(q);
  return addons.filter((a) =>
    (!price || (price === "free" ? Number(a.price) === 0 : Number(a.price) > 0))
    && (!text || includesText(text, a.name)));
};
