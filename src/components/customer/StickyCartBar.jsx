import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/format";
import { cartSubtotal, itemsCount } from "@/lib/cart";
import { cn } from "@/lib/cn";

/**
 * بار لاصق في الأسفل — بيظهر لما السلة مش فاضية
 */
export default function StickyCartBar({ onOpen }) {
  const items = useCartStore((s) => s.items);
  const total = cartSubtotal(items);
  const count = itemsCount(items);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pb-safe md:flex md:justify-center">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full items-center gap-3 bg-brand-red px-5 py-4 text-white shadow-pop transition",
          "hover:bg-brand-red-dark active:scale-[.99]",
          "md:mb-4 md:w-auto md:min-w-[320px] md:rounded-full"
        )}
      >
        <span className="relative">
          <ShoppingCart className="h-6 w-6" aria-hidden />
          <span className="absolute -end-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-yellow text-xs font-bold text-ink">
            {count}
          </span>
        </span>
        <span className="flex-1 text-start font-bold">كمّل الطلب</span>
        <span className="font-extrabold">{formatPrice(total)}</span>
      </button>
    </div>
  );
}
