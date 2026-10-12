import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";
import { readSettings } from "./menu";
import { canChangeOrderStatus } from "@/lib/constants";
import { formatDayLabel, getLockedDates, withLam } from "@/lib/dates";
import {
  availablePaymentMethods, defaultPayment, isElectronicPayment, validateProofFile,
} from "@/lib/payments";
import { blobToDataUrl, compressImage } from "@/lib/image";
import { findEnabledArea } from "@/lib/delivery";
import { filterOrders } from "@/lib/filters";

/** طلب قديم من قبل طرق الدفع => كاش ومش محتاج دفع (والحقول الناقصة بقيمها الافتراضية) */
/**
 * ترحيل البيانات المتخزنة من النسخ القديمة (مراجعة الدفع، ورفع الإيصال بعد الطلب — الاتنين اتشالوا):
 * pending_review => confirmed (الإيصال كان وصل). rejected و awaiting_proof => confirmed من غير صورة متسجلة
 * (طريقة الدفع زي ما هي، ومفيش خطوة تانية مطلوبة من حد؛ الأدمن بيشوف إن مفيش صورة في تفاصيل الطلب).
 * حقول المراجعة القديمة (rejectReason/rejectNote/reviewedAt/attempts) بتتشال.
 */
const MIGRATED_PAYMENT_STATUS = { pending_review: "confirmed", rejected: "confirmed", awaiting_proof: "confirmed" };

export const normalizeOrder = (o) => {
  const paymentMethod = o.paymentMethod || "cash";
  const stored = { ...defaultPayment(paymentMethod), ...o.payment };
  const status = MIGRATED_PAYMENT_STATUS[stored.status] || stored.status;
  const proofUploadedAt = stored.status === "rejected" ? null : stored.proofUploadedAt ?? null;
  return { ...o, paymentMethod, payment: { status, proofUploadedAt } };
};

const read = () => db.read("orders", []).map(normalizeOrder);

/**
 * صور الإيصالات في مفتاح لوحدها (مش جوه الطلبات اللي بتتقري في كل طلب API):
 * { [orderId]: { src: dataURL, size, uploadedAt } } — بتتحمّل بس في صفحة التفاصيل.
 */
const readProofs = () => db.read("paymentProofs", {});

/** امتلاء localStorage => رسالة واضحة بدل خطأ المتصفح */
const storageError = (e) =>
  e?.name === "QuotaExceededError" || e?.code === 22
    ? new Error("مساحة التخزين في المتصفح اتملت ومقدرناش نحفظ الصورة. جرّب صورة أصغر أو كلّمنا على واتساب.")
    : e;

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

/** فلترة الطلبات (نفس منطق GET /admin/orders?q=&status=&date=&payment=&area=&created=&sort= على الباك) */
export { filterOrders };

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
  /**
   * إنشاء طلب: POST /orders — payload: { customer, items, paymentMethod, deliveryAreaId }.
   * رسوم التوصيل بتتحسب من المنطقة المختارة في الإعدادات (عمرها ما بتتاخد من الفرونت).
   * التحويل (فودافون كاش/إنستاباي): صورة التحويل إجبارية وبتتبعت مع الطلب في نفس الريكوست
   * (multipart: الحقل "order" فيه الطلب JSON والحقل "proof" الصورة) => الطلب بيتعمل والدفع "confirmed"، وعمره ما يتعمل من غير صورته.
   * التحقق (النوع والحجم) قبل الضغط، والضغط في المتصفح (1280px، JPEG 0.75) قبل الرفع.
   * الموك: الصورة في paymentProofs والطلب في orders — والاتنين يا يتحفظوا يا لأ.
   */
  create: async (payload, proofFile) => {
    let blob = null;
    if (isElectronicPayment(payload.paymentMethod)) {
      if (!proofFile) throw new Error("ارفع صورة التحويل عشان تكمّل");
      const fileError = validateProofFile(proofFile);
      if (fileError) throw new Error(fileError);
      blob = await compressImage(proofFile);
    }
    if (!USE_MOCK) {
      if (!blob) return http("/orders", { method: "POST", body: payload });
      const form = new FormData();
      form.append("order", JSON.stringify(payload));
      form.append("proof", blob, "payment-proof.jpg");
      return http("/orders", { method: "POST", body: form });
    }
    const src = blob ? await blobToDataUrl(blob) : null;
    return simulate(() => {
      const orders = read();
      const settings = readSettings();
      // الباك لازم يرفض أي وجبة ليوم اتقفل (نفس قاعدة القفل بالظبط)
      const locked = getLockedDates(payload.items.map((it) => it.date), settings);
      if (locked.length) {
        throw new Error(`الطلب ${locked.map((d) => withLam(formatDayLabel(d))).join("، ")} اتقفل. شيل وجبات اليوم ده من السلة وكمّل.`);
      }
      // طريقة الدفع لازم تكون متاحة في الإعدادات دلوقتي (الأدمن ممكن يكون قفلها)
      const paymentMethod = payload.paymentMethod || "cash";
      if (!availablePaymentMethods(settings).includes(paymentMethod)) {
        throw new Error("طريقة الدفع دي مش متاحة دلوقتي. اختار طريقة تانية وأكّد الطلب.");
      }
      // منطقة التوصيل لازم تكون موجودة ومفعّلة دلوقتي، والرسوم من سعرها في الإعدادات (زي الباك) مش من الفرونت
      const area = findEnabledArea(settings, payload.deliveryAreaId);
      if (!area) throw new Error("منطقة التوصيل دي مش متاحة دلوقتي. اختار منطقتك تاني وأكّد الطلب.");
      const { subtotal, deliveryFee, total } = calcOrderTotal(payload.items, area.price);
      const createdAt = new Date().toISOString();
      const order = {
        id: uid("o"),
        orderNumber: 1001 + orders.length,
        status: "new",
        createdAt,
        customer: payload.customer,
        items: payload.items,
        // نسخة من المنطقة والرسوم وقت الطلب: تغيير اسمها أو سعرها بعدين ما يغيّرش الطلبات القديمة
        deliveryArea: { id: area.id, name: area.name },
        subtotal, deliveryFee, totalPrice: total,
        paymentMethod,
        payment: src ? { status: "confirmed", proofUploadedAt: createdAt } : defaultPayment(paymentMethod),
      };
      if (!src) {
        db.write("orders", [order, ...orders]);
        return order;
      }
      let proofs;
      try {
        proofs = readProofs(); // أول مرة بيكتب {} فاضية => جوه الـ try برضه
        db.write("paymentProofs", { ...proofs, [order.id]: { src, size: blob.size, uploadedAt: createdAt } });
      } catch (e) {
        throw storageError(e);
      }
      try {
        db.write("orders", [order, ...orders]);
      } catch (e) {
        db.write("paymentProofs", proofs); // رجوع: ما نسيبش صورة من غير طلب
        throw storageError(e);
      }
      return order;
    }, 500);
  },

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

  /** صورة الإيصال للأدمن: GET /admin/orders/:id/payment-proof => { src, size, uploadedAt } أو null */
  getPaymentProof: (orderId) =>
    USE_MOCK
      ? simulate(() => readProofs()[orderId] || null)
      : http(`/admin/orders/${orderId}/payment-proof`),
};
