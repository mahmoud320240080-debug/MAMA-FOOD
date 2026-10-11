import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

/**
 * أنيميشنات الـ empty states (ملفات محلية — المصدر والترخيص في CREDITS.md).
 * الـ player والـ JSON بيتحمّلوا lazy في chunks منفصلة (مش في الـ main bundle).
 * المساحة محجوزة بالمقاس من الأول => مفيش layout shift.
 */
const animations = {
  emptyCart: { load: () => import("@/assets/lottie/empty-cart.json"), still: 0 },
  noOrders: { load: () => import("@/assets/lottie/no-orders.json"), still: 70 },
  noMeals: { load: () => import("@/assets/lottie/no-meals.json"), still: 25 },
  noResults: { load: () => import("@/assets/lottie/no-results.json"), still: 0 },
  notFound: { load: () => import("@/assets/lottie/not-found.json"), still: 0 },
};

const loadPlayer = () => import("lottie-web/build/player/lottie_light").then((m) => m.default || m);

export default function LottieAnimation({ name, size = 160, className }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const entry = animations[name];
    if (!entry) return undefined;
    let anim;
    let cancelled = false;
    Promise.all([loadPlayer(), entry.load()])
      .then(([lottie, data]) => {
        if (cancelled || !ref.current) return;
        anim = lottie.loadAnimation({
          container: ref.current,
          renderer: "svg",
          loop: !reduced,
          autoplay: !reduced,
          animationData: data.default || data,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });
        // تقليل الحركة: فريم ثابت
        if (reduced) anim.goToAndStop(entry.still, true);
      })
      .catch(() => { /* الأنيميشن ديكور بس — لو فشل التحميل المساحة بتفضل فاضية */ });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [name, reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-lottie={name}
      className={cn("pointer-events-none shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
