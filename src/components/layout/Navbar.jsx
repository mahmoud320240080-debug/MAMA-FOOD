import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ShoppingBag } from "lucide-react";
import { Brand } from "@/components/common/Logo";
import CartCountBadge from "@/components/customer/CartCountBadge";
import { useCartStore } from "@/store/useCartStore";
import { useUIStore } from "@/store/useUIStore";
import { itemsCount } from "@/lib/cart";
import { DAYS_SECTION_ID, scrollToSection } from "@/lib/scroll";

export default function Navbar() {
  const items = useCartStore((s) => s.items);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const count = itemsCount(items);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // في الرئيسية: سكرول لقسم الأيام. من أي صفحة تانية: نرجع للرئيسية والـ hash بيوديها على القسم
  const goToDays = () => {
    if (pathname === "/") scrollToSection(DAYS_SECTION_ID);
    else navigate(`/#${DAYS_SECTION_ID}`);
  };

  return (
    // نفس أحمر الهيرو بالظبط (صلب، من غير زجاج ولا ظل) => مفيش فاصل بينهم
    <header className="sticky top-0 z-40 bg-brand-red pt-safe">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4">
        <Link to="/" aria-label="MAMA FOOD - الرئيسية" className="flex min-h-[44px] min-w-0 items-center">
          <Brand tone="onRed" size="nav" />
        </Link>
        <div id="navbar-actions" className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={goToDays}
            aria-label="اختار أيامك"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full bg-brand-yellow px-3 text-sm font-bold text-ink shadow-sm transition hover:brightness-95 active:scale-95 motion-reduce:active:scale-100 sm:px-4"
          >
            {/* 320-360px: أيقونة بس. 361-639: الكلام بس. sm وأكبر: الاتنين */}
            <CalendarDays className="h-5 w-5 shrink-0 min-[361px]:hidden sm:block" aria-hidden />
            <span className="hidden whitespace-nowrap min-[361px]:inline">اختار أيامك</span>
          </button>
          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`السلة (${count} وجبة)`}
            data-cart-target="desktop"
            className="relative grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 active:scale-95"
          >
            <span data-cart-bump className="grid place-items-center">
              <ShoppingBag className="h-6 w-6" aria-hidden />
            </span>
            <CartCountBadge count={count} className="absolute -start-1 -top-1" />
          </button>
        </div>
      </div>
    </header>
  );
}
