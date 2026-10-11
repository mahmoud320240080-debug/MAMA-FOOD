import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "@/components/customer/CartDrawer";
import MobileDock from "@/components/customer/MobileDock";
import StickyCartBar from "@/components/customer/StickyCartBar";
import RouteTransition from "@/components/common/RouteTransition";
import PageLoader from "@/components/common/PageLoader";
import { loadCheckout } from "@/routes/pages";
import { useUIStore } from "@/store/useUIStore";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/cn";

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const cartDrawerOpen = useUIStore((s) => s.cartDrawerOpen);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);
  const hasItems = useCartStore((s) => s.items.length > 0);
  // كبسولة السلة العايمة (تابلت/لاب توب) بتظهر في الرئيسية لما السلة مش فاضية
  const showFloatingBar = hasItems && pathname === "/";
  // أول ما السلة يبقى فيها حاجة نحمّل صفحة الطلب في الخلفية => "كمّل الطلب" بيفتحها على طول من غير لودر
  useEffect(() => { if (hasItems) loadCheckout(); }, [hasItems]);

  return (
    // موبايل: padding تحت بارتفاع الدوك (البوتوم ناف + بار السلة). تابلت/لاب توب: مساحة للكبسولة العايمة
    // => مفيش محتوى (ولا الفوتر) بيستخبى وراهم
    <div className={cn("flex min-h-dvh flex-col pb-[var(--dock-h,0px)]", showFloatingBar ? "md:pb-24" : "md:pb-0")}>
      <Navbar />
      <main className="flex-1">
        {/* صفحة lazy بتتحمّل: الناف بار والفوتر فاضلين مكانهم واللودر بنفس ارتفاع صفحة 404 */}
        <Suspense fallback={<PageLoader className="min-h-[70vh]" />}>
          <RouteTransition><Outlet /></RouteTransition>
        </Suspense>
      </main>
      <Footer />
      <MobileDock />
      {showFloatingBar && <StickyCartBar variant="floating" />}
      <CartDrawer open={cartDrawerOpen} onClose={closeCartDrawer} />
    </div>
  );
}
