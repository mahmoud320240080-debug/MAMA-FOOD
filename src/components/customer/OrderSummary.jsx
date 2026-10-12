import { CalendarDays, StickyNote } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { groupItemsByDate, daySubtotal, lineTotal, cartSubtotal } from "@/lib/cart";

/**
 * ملخص الطلب — بيستخدم في الشيك آوت وصفحة النجاح
 */
export default function OrderSummary({ items, deliveryFee = 0, collapsible = false }) {
  const grouped = groupItemsByDate(items);
  const sortedDates = Object.keys(grouped).sort();
  const sub = cartSubtotal(items);
  const total = sub + deliveryFee;

  const content = (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayItems = grouped[date];
        return (
          <div key={date}>
            <div className="mb-1.5 flex items-center justify-between">
              <h4 className="flex items-center gap-1.5 font-bold">
                <CalendarDays className="h-[18px] w-[18px] shrink-0 text-brand-red" aria-hidden />
                {formatDayMonth(date)}
              </h4>
              <span className="text-sm font-semibold text-ink-soft">
                {formatPrice(daySubtotal(dayItems))}
              </span>
            </div>
            <ul className="space-y-1">
              {dayItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-ink-soft"> × {item.quantity}</span>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-ink-soft truncate">
                        + {item.addons.map((a) => a.name).join("، ")}
                      </p>
                    )}
                    {item.note && (
                      <p className="flex items-center gap-1 text-xs text-ink-soft">
                        <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="min-w-0 truncate">{item.note}</span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold">
                    {formatPrice(lineTotal(item))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <hr className="border-ink/10" />
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-soft">المجموع</span>
          <span className="font-semibold">{formatPrice(sub)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-soft">التوصيل</span>
          <span className="font-semibold">{formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex justify-between text-lg font-extrabold">
          <span>الإجمالي</span>
          <span className="text-brand-red">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-soft">{content}</div>
    );
  }

  // Collapsible version for mobile checkout
  return (
    <details className="group rounded-3xl bg-white shadow-soft">
      <summary className="flex min-h-[56px] cursor-pointer items-center justify-between px-5 py-4 font-bold">
        <span>ملخص الطلب ({items.length} عنصر)</span>
        <span className="text-brand-red">{formatPrice(total)}</span>
      </summary>
      <div className="border-t border-ink/10 p-5">{content}</div>
    </details>
  );
}
