import logoRed from "@/assets/logo-red.png";
import logoYellow from "@/assets/logo-yellow.png";
import iconYellow from "@/assets/icon-yellow.png";
import iconRed from "@/assets/icon-red.png";
import { cn } from "@/lib/cn";

// المقاس الحقيقي للصور: المتصفح بيحجز المساحة قبل ما الصورة تتحمّل => مفيش layout shift
const FULL = { width: 669, height: 468 };
const ICON = { width: 395, height: 351 };

/**
 * tone: "onRed" (أصفر على أحمر) | "onLight" (أحمر على فاتح)
 * priority: للوجو اللي في أول الشاشة (الهيرو) — بيتحمّل بأولوية عالية لأنه غالباً الـ LCP
 */
export function LogoFull({ tone = "onRed", className, priority = false }) {
  return (
    <img
      src={tone === "onRed" ? logoYellow : logoRed}
      alt="MAMA FOOD - Home Made Food"
      {...FULL}
      {...(priority ? { fetchpriority: "high" } : { loading: "lazy" })}
      className={cn("h-auto", className)}
    />
  );
}

export function LogoIcon({ tone = "onRed", className }) {
  return <img src={tone === "onRed" ? iconYellow : iconRed} alt="" aria-hidden {...ICON} className={cn("h-auto", className)} />;
}

/**
 * size="nav" (ناف بار الزبون): أصغر شوية على الموبايل عشان يكفي جنب الزراير في سطر واحد،
 * والـ padding فوق الكلام بيعوّض إن خط Baloo بيحط الحروف اللاتيني أعلى من نص السطر
 * => الكلام يبقى في نص الأيقونة (مع جسم الـ M) بصرياً.
 */
const BRAND_SIZES = {
  md: { wrap: "gap-2.5", icon: "w-10", text: "text-2xl" },
  nav: { wrap: "gap-2 sm:gap-3", icon: "w-9 shrink-0 sm:w-10", text: "whitespace-nowrap pt-[0.3em] text-xl sm:text-2xl" },
};

/** أيقونة M + اسم الموقع (للـ Navbar والسايدبار) */
export function Brand({ tone = "onRed", size = "md", className }) {
  const s = BRAND_SIZES[size];
  return (
    <span className={cn("flex items-center", s.wrap, className)}>
      <LogoIcon tone={tone} className={s.icon} />
      <span className={cn("font-display font-extrabold leading-none tracking-wide", s.text,
        tone === "onRed" ? "text-brand-yellow" : "text-brand-red")}>MAMA FOOD</span>
    </span>
  );
}
