/**
 * حسابات السلة — دوال نقية بدون side effects.
 * الحساب النهائي للطلب بيتم عن طريق calcOrderTotal من src/api/orders.js
 */

/** هوية السطر = تاريخ + وجبة + إضافات (مرتبة) + ملاحظة */
export const generateLineId = (date, mealId, addons = [], note = "") => {
  const addonIds = addons.map((a) => a.id).sort().join(",");
  return `${date}|${mealId}|${addonIds}|${note}`;
};

/** إجمالي سطر واحد (سعر الوجبة + الإضافات) × الكمية */
export const lineTotal = (item) =>
  (item.price + item.addons.reduce((s, a) => s + a.price, 0)) * item.quantity;

/** إجمالي يوم معين */
export const daySubtotal = (items) => items.reduce((s, it) => s + lineTotal(it), 0);

/** إجمالي السلة كلها */
export const cartSubtotal = (items) => items.reduce((s, it) => s + lineTotal(it), 0);

/** عدد العناصر (مجموع الكميات) */
export const itemsCount = (items) => items.reduce((s, it) => s + it.quantity, 0);

/** تجميع العناصر حسب اليوم { [date]: CartItem[] } */
export const groupItemsByDate = (items) =>
  items.reduce((map, item) => {
    (map[item.date] = map[item.date] || []).push(item);
    return map;
  }, {});
