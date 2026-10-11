import { m } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import CartCountBadge from "./CartCountBadge";
import { formatPrice } from "@/lib/format";
import { cartSubtotal, itemsCount } from "@/lib/cart";
import { springs } from "@/lib/motion";

/**
 * بار السلة — بيظهر لما السلة مش فاضية (في الرئيسية):
 * - variant="dock": موبايل، جوه الـ MobileDock فوق البوتوم ناف على طول (مستحيل يتداخلوا)
 * - variant="floating": تابلت/لاب توب، كبسولة حمرا عايمة تحت في النص
 */
export default function StickyCartBar({ variant = "floating" }) {
  const items = useCartStore((s) => s.items);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const total = cartSubtotal(items);
  const count = itemsCount(items);

  if (count === 0) return null;

  if (variant === "dock") {
    return (
      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={springs.overlay} className="px-3 pt-2.5">
        <button
          type="button"
          onClick={openCartDrawer}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl bg-brand-red px-4 text-white shadow-pop transition hover:bg-brand-red-dark active:scale-[.98] motion-reduce:active:scale-100"
        >
          <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
          <span className="flex-1 text-start font-bold">كمّل الطلب</span>
          <span className="shrink-0 font-extrabold tabular-nums">{formatPrice(total)}</span>
        </button>
      </m.div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden justify-center px-4 pb-safe md:flex">
      <m.button
        type="button"
        onClick={openCartDrawer}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.overlay}
        data-floating-cart
        className="pointer-events-auto mb-4 flex min-h-[56px] min-w-[320px] items-center gap-3 rounded-full bg-brand-red px-6 text-white shadow-pop transition-colors hover:bg-brand-red-dark"
      >
        <span className="relative">
          <ShoppingCart className="h-6 w-6" aria-hidden />
          <CartCountBadge count={count} className="absolute -end-2.5 -top-2.5" />
        </span>
        <span className="flex-1 text-start font-bold">كمّل الطلب</span>
        <span className="font-extrabold tabular-nums">{formatPrice(total)}</span>
      </m.button>
    </div>
  );
}
