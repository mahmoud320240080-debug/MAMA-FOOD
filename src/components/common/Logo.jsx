import logoRed from "@/assets/logo-red.png";
import logoYellow from "@/assets/logo-yellow.png";
import iconYellow from "@/assets/icon-yellow.png";
import iconRed from "@/assets/icon-red.png";
import { cn } from "@/lib/cn";

/** tone: "onRed" (أصفر على أحمر) | "onLight" (أحمر على فاتح) */
export function LogoFull({ tone = "onRed", className }) {
  return <img src={tone === "onRed" ? logoYellow : logoRed} alt="MAMA FOOD - Home Made Food" className={cn("h-auto", className)} />;
}

export function LogoIcon({ tone = "onRed", className }) {
  return <img src={tone === "onRed" ? iconYellow : iconRed} alt="" aria-hidden className={cn("h-auto", className)} />;
}

/** أيقونة M + اسم الموقع (للـ Navbar) */
export function Brand({ tone = "onRed", className }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoIcon tone={tone} className="w-10" />
      <span className={cn("font-display text-2xl font-extrabold leading-none tracking-wide",
        tone === "onRed" ? "text-brand-yellow" : "text-brand-red")}>MAMA FOOD</span>
    </span>
  );
}
