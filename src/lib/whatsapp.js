/**
 * رسالة واتساب مفصلة بالطلب — مجمعة حسب اليوم.
 */
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { groupItemsByDate, lineTotal, cartSubtotal } from "@/lib/cart";
import { WHATSAPP_NUMBER } from "@/api/config";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatDeliveryFee } from "@/lib/delivery";

/**
 * @param {Object} params
 * @param {import("@/store/useCartStore").CartItem[]} params.items
 * @param {{ name: string, phone: string, address: string, notes?: string }} params.customer
 * @param {number|null} params.deliveryFee - null = المنطقة لسه ما اتختارتش
 * @param {string} [params.deliveryAreaName]
 * @param {number} [params.orderNumber]
 * @param {"cash"|"vodafone_cash"|"instapay"} [params.paymentMethod]
 * @returns {string} الرسالة المنسقة
 */
export function buildWhatsAppMessage({ items = [], customer = {}, deliveryFee = 0, deliveryAreaName, orderNumber, paymentMethod }) {
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
  const deliveryLabel = deliveryAreaName ? `التوصيل (${deliveryAreaName})` : "التوصيل";
  lines.push(`${deliveryLabel}: ${deliveryFee == null ? "حسب المنطقة" : formatDeliveryFee(deliveryFee)}`);
  lines.push(`*الإجمالي: ${formatPrice(sub + (deliveryFee ?? 0))}*`);
  if (paymentMethod) lines.push(`طريقة الدفع: ${PAYMENT_METHODS[paymentMethod]?.label || PAYMENT_METHODS.cash.label}`);
  lines.push("");
  if (customer.name) lines.push(`👤 ${customer.name}`);
  if (customer.phone) lines.push(`📞 ${customer.phone}`);
  if (deliveryAreaName) lines.push(`العنوان: ${deliveryAreaName}`);
  if (customer.address) lines.push(deliveryAreaName ? `📍 تفاصيل العنوان: ${customer.address}` : `📍 ${customer.address}`);
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
