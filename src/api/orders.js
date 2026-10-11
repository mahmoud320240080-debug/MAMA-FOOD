import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";
import { readSettings } from "./menu";
import { canChangeOrderStatus } from "@/lib/constants";
import { formatDayLabel, getLockedDates, withLam } from "@/lib/dates";

const read = () => db.read("orders", []);

/** بيشيل الفلاتر الفاضية عشان ما تتبعتش "undefined" في الـ query string */
const cleanParams = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/**
 * ملحوظة للباك: الفرونت بيحسب السعر هنا للديمو بس.
 * الباك لازم يعيد حساب كل الأسعار من الداتابيز ويتحقق من الأيام المقفولة.
 */
export const calcOrderTotal = (items, deliveryFee = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + (it.price + it.addons.reduce((a, x) => a + x.price, 0)) * it.quantity, 0);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
};

/** الأيام المطلوبة في الطلب (مش يوم إنشاء الطلب) — مترتبة */
export const orderDates = (order) => [...new Set(order.items.map((it) => it.date))].sort();

/**
 * فلترة الطلبات (نفس منطق GET /admin/orders?q=&status=&date= على الباك)
 * q: رقم الطلب أو اسم العميل أو الموبايل | date: أي طلب فيه صنف لليوم ده
 * النتيجة: الأحدث الأول
 */
export const filterOrders = (orders, { q, status, date } = {}) => {
  const term = q?.trim().toLowerCase().replace(/^#/, "");
  return orders
    .filter((o) => !status || o.status === status)
    .filter((o) => !date || o.items.some((it) => it.date === date))
    .filter((o) => !term
      || String(o.orderNumber).includes(term)
      || (o.customer?.name || "").toLowerCase().includes(term)
      || (o.customer?.phone || "").includes(term))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

/**
 * ملخص التحضير ليوم معين: إجمالي كل وجبة وكل إضافة (الطلبات الملغية مش محسوبة).
 * الإضافة بتتعد مرة لكل وحدة من الوجبة (3 كشري بسلطة = 3 سلطة).
 */
export const buildPrepSummary = (orders, date) => {
  const meals = new Map();
  const addons = new Map();
  const bump = (map, id, name, qty) => {
    const row = map.get(id) || { id, name, quantity: 0 };
    row.quantity += qty;
    map.set(id, row);
  };
  let ordersCount = 0;
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const dayItems = o.items.filter((it) => it.date === date);
    if (!dayItems.length) continue;
    ordersCount++;
    for (const it of dayItems) {
      bump(meals, it.mealId, it.name, it.quantity);
      for (const a of it.addons) bump(addons, a.id, a.name, it.quantity);
    }
  }
  const byQty = (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "ar");
  const mealRows = [...meals.values()].sort(byQty);
  return {
    date,
    ordersCount,
    mealsCount: mealRows.reduce((s, m) => s + m.quantity, 0),
    meals: mealRows,
    addons: [...addons.values()].sort(byQty),
  };
};

export const ordersApi = {
  create: (payload) =>
    USE_MOCK
      ? simulate(() => {
          const orders = read();
          const settings = readSettings();
          // الباك لازم يرفض أي وجبة ليوم اتقفل (نفس قاعدة القفل بالظبط)
          const locked = getLockedDates(payload.items.map((it) => it.date), settings);
          if (locked.length) {
            throw new Error(`الطلب ${locked.map((d) => withLam(formatDayLabel(d))).join("، ")} اتقفل. شيل وجبات اليوم ده من السلة وكمّل.`);
          }
          // رسوم التوصيل من الإعدادات (زي الباك) مش من اللي الفرونت باعته
          const { subtotal, deliveryFee, total } = calcOrderTotal(payload.items, settings.deliveryFee ?? 0);
          const order = {
            id: uid("o"),
            orderNumber: 1001 + orders.length,
            status: "new",
            createdAt: new Date().toISOString(),
            customer: payload.customer,
            items: payload.items,
            subtotal, deliveryFee, totalPrice: total,
          };
          db.write("orders", [order, ...orders]);
          return order;
        }, 500)
      : http("/orders", { method: "POST", body: payload }),

  /** filters: { q?, status?, date? } */
  list: (filters = {}) =>
    USE_MOCK
      ? simulate(() => filterOrders(read(), filters))
      : http("/admin/orders", { params: cleanParams(filters) }),

  get: (id) =>
    USE_MOCK
      ? simulate(() => { const o = read().find((x) => x.id === id); if (!o) throw new Error("الطلب مش موجود"); return o; })
      : http(`/orders/${id}`),

  updateStatus: (id, status) =>
    USE_MOCK
      ? simulate(() => {
          const current = read().find((o) => o.id === id);
          if (!current) throw new Error("الطلب مش موجود");
          if (!canChangeOrderStatus(current.status, status)) throw new Error("مينفعش تغيّر الحالة للحالة دي");
          const all = read().map((o) => (o.id === id ? { ...o, status } : o));
          db.write("orders", all);
          return all.find((o) => o.id === id);
        })
      : http(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),

  bulkUpdateStatus: (ids, status) =>
    USE_MOCK
      ? simulate(() => {
          const all = read();
          const targetIds = new Set(ids);
          let updatedCount = 0;
          let skippedCount = 0;
          const updated = all.map((o) => {
            if (targetIds.has(o.id)) {
              if (canChangeOrderStatus(o.status, status)) {
                updatedCount++;
                return { ...o, status };
              } else {
                skippedCount++;
                return o;
              }
            }
            return o;
          });
          db.write("orders", updated);
          return {
            updatedCount,
            skippedCount,
            total: ids.length,
            updatedOrders: updated.filter((o) => targetIds.has(o.id) && o.status === status),
          };
        })
      : http("/admin/orders/bulk-status", { method: "PATCH", body: { ids, status } }),

  /** ملخص التحضير ليوم: GET /admin/orders/prep?date=YYYY-MM-DD */
  prepSummary: (date) =>
    USE_MOCK
      ? simulate(() => buildPrepSummary(read(), date))
      : http("/admin/orders/prep", { params: { date } }),
};
