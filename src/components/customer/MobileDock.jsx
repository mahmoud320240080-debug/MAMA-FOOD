import { useLayoutEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { m } from "framer-motion";
import { ClipboardCheck, Home, ShoppingBag } from "lucide-react";
import StickyCartBar from "./StickyCartBar";
import CartCountBadge from "./CartCountBadge";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { toast } from "@/store/useToastStore";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { itemsCount } from "@/lib/cart";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

const itemCls = (active) =>
  cn(
    "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold transition active:scale-95 motion-reduce:active:scale-100",
    active ? "text-brand-red-dark" : "text-ink-soft hover:text-ink"
  );
const iconWrap = (active) => cn("relative grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-brand-red/10");

function BottomNav({ count }) {
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const cartOpen = useUIStore((s) => s.cartDrawerOpen);

  return (
    <nav aria-label="التنقل" className="flex items-stretch gap-1 px-2 pb-1 pt-1.5">
      <NavLink to="/" end className={({ isActive }) => itemCls(isActive && !cartOpen)}>
        {({ isActive }) => (
          <>
            <span className={iconWrap(isActive && !cartOpen)}><Home className="h-5 w-5" aria-hidden /></span>
            الرئيسية
          </>
        )}
      </NavLink>

      <button
        type="button"
        onClick={openCartDrawer}
        aria-label={`السلة (${count} وجبة)`}
        data-cart-target="mobile"
        className={itemCls(cartOpen)}
      >
        <span className={iconWrap(cartOpen)}>
          <span data-cart-bump className="grid place-items-center"><ShoppingBag className="h-5 w-5" aria-hidden /></span>
          <CartCountBadge count={count} className="absolute -top-1.5 end-1" />
        </span>
        <span aria-hidden>السلة</span>
      </button>

      {count > 0 ? (
        <NavLink to="/checkout" className={({ isActive }) => itemCls(isActive)}>
          {({ isActive }) => (
            <>
              <span className={iconWrap(isActive)}><ClipboardCheck className="h-5 w-5" aria-hidden /></span>
              إتمام الطلب
            </>
          )}
        </NavLink>
      ) : (
        // السلة فاضية: صفحة الطلب بترجع للرئيسية، فبدل ما ننقل بنقول للزبون
        <button
          type="button"
          aria-disabled="true"
          onClick={() => toast.info("السلة فاضية — اختار وجباتك الأول")}
          className={cn(itemCls(false), "opacity-60")}
        >
          <span className={iconWrap(false)}><ClipboardCheck className="h-5 w-5" aria-hidden /></span>
          إتمام الطلب
        </button>
      )}
    </nav>
  );
}

/**
 * الدوك اللي تحت على الموبايل بس (< 768px) في صفحات الزبون:
 * بار السلة (في الرئيسية لما السلة مش فاضية) فوق البوتوم ناف على طول، في لوح زجاج واحد.
 * - بيستخبى وقت ما الكيبورد مفتوح عشان ما يغطيش الحقول
 * - ارتفاعه بيتحط في --dock-h عشان الصفحة تاخد padding تحت ومفيش حاجة تستخبى وراه
 */
export default function MobileDock() {
  const { pathname } = useLocation();
  const items = useCartStore((s) => s.items);
  const count = itemsCount(items);
  const keyboardOpen = useKeyboardOpen();
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--dock-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => { ro.disconnect(); root.style.removeProperty("--dock-h"); };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden" data-mobile-dock data-hidden={keyboardOpen ? "true" : undefined}>
      <m.div
        ref={ref}
        initial={false}
        animate={{ y: keyboardOpen ? "110%" : 0, opacity: keyboardOpen ? 0 : 1 }}
        transition={springs.overlay}
        className="glass-cream border-t border-ink/10 pb-safe shadow-[0_-10px_30px_-18px_rgba(43,27,23,.35)]"
        style={keyboardOpen ? { pointerEvents: "none" } : undefined}
        {...(keyboardOpen ? { inert: "" } : {})}
      >
        {pathname === "/" && <StickyCartBar variant="dock" />}
        <BottomNav count={count} />
      </m.div>
    </div>
  );
}
