import { StickyNote, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { lineTotal } from "@/lib/cart";
import { useCartStore } from "@/store/useCartStore";
import QuantityStepper from "./QuantityStepper";

/**
 * سطر عنصر في السلة — وجبة + إضافات + ملاحظة + كمية + سعر + حذف
 */
export default function CartLine({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 rounded-2xl bg-cream-dark/50 p-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-bold truncate">{item.name}</h4>
        {item.addons.length > 0 && (
          <p className="mt-0.5 text-sm text-ink-soft truncate">
            {item.addons.map((a) => a.name).join("، ")}
          </p>
        )}
        {item.note && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
            <StickyNote className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{item.note}</span>
          </p>
        )}
        <p className="mt-1 text-sm font-bold text-brand-red">
          {formatPrice(lineTotal(item))}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => removeItem(item.id)}
          aria-label={`حذف ${item.name}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red/10 hover:text-brand-red"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
        <QuantityStepper
          value={item.quantity}
          onChange={(q) => updateQuantity(item.id, q)}
          min={0}
        />
      </div>
    </div>
  );
}
