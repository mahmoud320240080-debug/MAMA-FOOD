import { Banknote, Landmark, Smartphone } from "lucide-react";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "@/lib/constants";
import { isElectronicPayment } from "@/lib/payments";
import { cn } from "@/lib/cn";

/** أيقونات عامة لطرق الدفع (من غير لوجوهات شركات) */
export const PAYMENT_ICONS = { cash: Banknote, vodafone_cash: Smartphone, instapay: Landmark };

/** طريقة الدفع: أيقونة + اسم */
export function PaymentMethodLabel({ method, className }) {
  const Icon = PAYMENT_ICONS[method] || Banknote;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon className="h-[18px] w-[18px] shrink-0 text-ink" aria-hidden />
      {PAYMENT_METHODS[method]?.label || PAYMENT_METHODS.cash.label}
    </span>
  );
}

/** بادج حالة الدفع (short = النسخة المختصرة للأماكن الضيقة) */
export function PaymentStatusBadge({ status, short = false, className }) {
  const s = PAYMENT_STATUS[status] || PAYMENT_STATUS.not_required;
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold", s.badge, className)}>
      {short ? s.short : s.label}
    </span>
  );
}

/**
 * شريحة الدفع الصغيرة في قوايم الأدمن: الكاش شريحة هادية "كاش"،
 * والإلكتروني أيقونة الطريقة + حالة الدفع المختصرة (والاسم كامل في الـ title وقارئ الشاشة).
 */
export function PaymentChip({ order, className }) {
  const method = order.paymentMethod || "cash";
  if (!isElectronicPayment(method)) {
    return (
      <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink-soft", className)}>
        <Banknote className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {PAYMENT_METHODS.cash.short}
      </span>
    );
  }
  const Icon = PAYMENT_ICONS[method];
  const s = PAYMENT_STATUS[order.payment?.status] || PAYMENT_STATUS.confirmed;
  const title = `${PAYMENT_METHODS[method].label}: ${s.label}`;
  return (
    <span title={title} className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold", s.badge, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span aria-hidden>{s.short}</span>
      <span className="sr-only">{title}</span>
    </span>
  );
}
