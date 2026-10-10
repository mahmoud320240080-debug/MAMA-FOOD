import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";

const read = () => db.read("orders", []);

/**
 * ملحوظة للباك: الفرونت بيحسب السعر هنا للديمو بس.
 * الباك لازم يعيد حساب كل الأسعار من الداتابيز ويتحقق من الأيام المقفولة.
 */
export const calcOrderTotal = (items, deliveryFee = 0) => {
  const subtotal = items.reduce(
    (s, it) => s + (it.price + it.addons.reduce((a, x) => a + x.price, 0)) * it.quantity, 0);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
};

export const ordersApi = {
  create: (payload) =>
    USE_MOCK
      ? simulate(() => {
          const orders = read();
          const { subtotal, deliveryFee, total } = calcOrderTotal(payload.items, payload.deliveryFee ?? 0);
          const order = {
            id: uid("o"),
            orderNumber: 1001 + orders.length,
            status: "new",
            createdAt: new Date().toISOString(),
            subtotal, deliveryFee, totalPrice: total,
            ...payload,
          };
          db.write("orders", [order, ...orders]);
          return order;
        }, 500)
      : http("/orders", { method: "POST", body: payload }),

  list: (filters = {}) =>
    USE_MOCK
      ? simulate(() => read().filter((o) => !filters.status || o.status === filters.status))
      : http("/admin/orders", { params: filters }),

  get: (id) =>
    USE_MOCK
      ? simulate(() => { const o = read().find((x) => x.id === id); if (!o) throw new Error("الطلب مش موجود"); return o; })
      : http(`/orders/${id}`),

  updateStatus: (id, status) =>
    USE_MOCK
      ? simulate(() => { const all = read().map((o) => (o.id === id ? { ...o, status } : o)); db.write("orders", all); return all.find((o) => o.id === id); })
      : http(`/admin/orders/${id}/status`, { method: "PATCH", body: { status } }),
};
