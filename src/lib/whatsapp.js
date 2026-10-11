/**
 * رسالة واتساب مفصلة بالطلب — مجمعة حسب اليوم.
 */
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { groupItemsByDate, lineTotal, cartSubtotal } from "@/lib/cart";
import { WHATSAPP_NUMBER } from "@/api/config";

/**
 * @param {Object} params
 * @param {import("@/store/useCartStore").CartItem[]} params.items
 * @param {{ name: string, phone: string, address: string, notes?: string }} params.customer
 * @param {number} params.deliveryFee
 * @param {number} [params.orderNumber]
 * @returns {string} الرسالة المنسقة
 */
export function buildWhatsAppMessage({ items = [], customer = {}, deliveryFee = 0, orderNumber }) {
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
      if (item.addons && item.addons.length) {
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
  if (customer.name) lines.push(`👤 ${customer.name}`);
  if (customer.phone) lines.push(`📞 ${customer.phone}`);
  if (customer.address) lines.push(`📍 ${customer.address}`);
  if (customer.notes) lines.push(`📝 ${customer.notes}`);

  return lines.join("\n");
}

/**
 * بناء رابط واتساب باستخدام WHATSAPP_NUMBER
 */
export function whatsappUrl(params, number = WHATSAPP_NUMBER) {
  // دعم الاستدعاء كـ (number, params) أو (params)
  if (typeof params === "string") {
    const targetNumber = params;
    const text = buildWhatsAppMessage(number || {});
    return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
  }
  const text = buildWhatsAppMessage(params || {});
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const buildWhatsAppUrl = whatsappUrl;

/** موبايل مصري 01XXXXXXXXX => 201XXXXXXXXX (الصيغة اللي wa.me محتاجها) */
export function toWhatsAppNumber(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0020")) return digits.slice(2);
  if (digits.startsWith("01") && digits.length === 11) return `2${digits}`;
  return digits;
}

/** رابط شات واتساب مع عميل (من غير رسالة جاهزة) */
export const customerWhatsappUrl = (phone) => `https://wa.me/${toWhatsAppNumber(phone)}`;
