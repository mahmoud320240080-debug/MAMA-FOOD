/**
 * رسالة واتساب مفصلة بالطلب — مجمعة حسب اليوم.
 */
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { groupItemsByDate, lineTotal, cartSubtotal } from "@/lib/cart";

/**
 * @param {Object} params
 * @param {import("@/store/useCartStore").CartItem[]} params.items
 * @param {{ name: string, phone: string, address: string, notes?: string }} params.customer
 * @param {number} params.deliveryFee
 * @param {number} [params.orderNumber]
 * @returns {string} الرسالة المنسقة
 */
export function buildWhatsAppMessage({ items, customer, deliveryFee, orderNumber }) {
  const lines = [];
  lines.push("🍽️ *طلب جديد من MAMA FOOD*");
  if (orderNumber) lines.push(`📋 رقم الطلب: *${orderNumber}*`);
  lines.push("");

  const grouped = groupItemsByDate(items);
  const sortedDates = Object.keys(grouped).sort();

  for (const date of sortedDates) {
    const dayItems = grouped[date];
    lines.push(`📅 *${formatDayMonth(date)}*`);
    for (const item of dayItems) {
      let line = `  • ${item.name} × ${item.quantity}`;
      if (item.addons.length) {
        line += ` (${item.addons.map((a) => a.name).join("، ")})`;
      }
      line += ` — ${formatPrice(lineTotal(item))}`;
      lines.push(line);
      if (item.note) lines.push(`    📝 ${item.note}`);
    }
    lines.push("");
  }

  const sub = cartSubtotal(items);
  lines.push(`المجموع: ${formatPrice(sub)}`);
  lines.push(`التوصيل: ${formatPrice(deliveryFee)}`);
  lines.push(`*الإجمالي: ${formatPrice(sub + deliveryFee)}*`);
  lines.push("");
  lines.push(`👤 ${customer.name}`);
  lines.push(`📞 ${customer.phone}`);
  lines.push(`📍 ${customer.address}`);
  if (customer.notes) lines.push(`📝 ${customer.notes}`);

  return lines.join("\n");
}

/**
 * بناء رابط واتساب كامل
 */
export function buildWhatsAppUrl(whatsappNumber, messageParams) {
  const text = buildWhatsAppMessage(messageParams);
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
