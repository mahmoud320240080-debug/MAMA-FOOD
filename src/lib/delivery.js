import { formatPrice } from "./format";

/**
 * مناطق التوصيل — مصدر واحد للـ API (الموك) وصفحة الإعدادات والشيك آوت.
 * المنطقة: { id, name, price, enabled }. السعر رقم صحيح >= 0 (0 = توصيل مجاني).
 */

/** id ثابت للمنطقة الجديدة (بيتعمل مرة واحدة وقت الإضافة ومبيتغيرش) */
export const newAreaId = () => `area_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

/** المناطق المفعّلة بس (اللي الزبون يشوفها) */
export const enabledAreas = (settings) => (settings?.deliveryAreas || []).filter((a) => a.enabled);

/** منطقة مفعّلة بالـ id أو null */
export const findEnabledArea = (settings, id) => enabledAreas(settings).find((a) => a.id === id) || null;

/** "توصيل مجاني" أو "25 جنيه" */
export const formatDeliveryFee = (fee) => (Number(fee) === 0 ? "توصيل مجاني" : formatPrice(fee));

/** اختيار المنطقة في الشيك آوت: "المعادي — 25 جنيه" / "المعادي — توصيل مجاني" */
export const areaOptionLabel = (area) => `${area.name} — ${formatDeliveryFee(area.price)}`;

const isWholePrice = (v) => v !== "" && v !== null && v !== undefined && Number.isInteger(Number(v)) && Number(v) >= 0;

/**
 * تحقق مناطق التوصيل قبل الحفظ (نفسه في الـ API وفي الفورم):
 * { rows: { [index]: { name?, price? } }, form?: string } — form = غلط على القايمة كلها
 */
export const validateDeliveryAreas = (areas = []) => {
  const rows = {};
  const setRow = (i, key, msg) => { rows[i] = { ...rows[i], [key]: msg }; };
  const seen = new Map();
  areas.forEach((a, i) => {
    const name = String(a.name ?? "").trim();
    if (!name) setRow(i, "name", "اكتب اسم المنطقة");
    else {
      const key = name.toLocaleLowerCase("ar");
      if (seen.has(key)) setRow(i, "name", "الاسم ده متكرر");
      else seen.set(key, i);
    }
    if (!isWholePrice(a.price)) setRow(i, "price", "اكتب سعر صحيح (0 أو أكتر)");
  });
  const form = areas.some((a) => a.enabled) ? undefined : "لازم يبقى فيه منطقة واحدة مفعّلة على الأقل";
  return { rows, form };
};

/** أول رسالة غلط (للـ API) أو null */
export const deliveryAreasError = (areas) => {
  const { rows, form } = validateDeliveryAreas(areas);
  const firstRow = Object.values(rows)[0];
  return form || (firstRow && (firstRow.name || firstRow.price)) || null;
};

/** تنضيف قبل الحفظ: trim للاسم والسعر رقم (فاضي => NaN عشان التحقق يرفضه بدل ما يبقى 0)، ومنطقة من غير id بتاخد id جديد */
export const cleanDeliveryAreas = (areas = []) =>
  areas.map((a) => ({
    id: a.id || newAreaId(),
    name: String(a.name ?? "").trim(),
    price: a.price === "" || a.price == null ? NaN : Number(a.price),
    enabled: !!a.enabled,
  }));
