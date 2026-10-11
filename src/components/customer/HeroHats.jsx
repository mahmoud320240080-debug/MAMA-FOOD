import { cn } from "@/lib/cn";

/** قبعة الشيف زي اللي فوق الـ M في اللوجو (SVG بلون currentColor) */
function ChefHat({ className, style }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("hat-float absolute", className)} style={style} aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <circle cx="18" cy="28" r="12" />
        <circle cx="32" cy="20" r="15" />
        <circle cx="46" cy="28" r="12" />
        <rect x="16" y="28" width="32" height="18" rx="3" />
      </g>
      <rect x="15" y="44" width="34" height="9" rx="3" fill="currentColor" opacity=".55" />
    </svg>
  );
}

/**
 * قبعات طايرة في الهيرو — ديكور بس: aria-hidden، من غير كليك، وفي منطقة الـ padding بتاعة الكارت
 * عشان ما تغطيش الكلام والزراير. موبايل: اتنين صغيرين. تابلت/لاب توب: خمسة.
 * مع "تقليل الحركة" بيقفوا (index.css).
 */
const HATS = [
  { cls: "start-1.5 top-1.5 h-5 w-5 text-brand-yellow md:start-4 md:top-4 md:h-10 md:w-10", r: -14, d: 6, delay: 0 },
  { cls: "bottom-1.5 end-1.5 h-5 w-5 text-cream md:bottom-4 md:end-6 md:h-9 md:w-9", r: 12, d: 7, delay: -2 },
  { cls: "hidden md:block end-5 top-6 h-8 w-8 text-cream", r: 10, d: 8, delay: -4 },
  { cls: "hidden md:block start-6 bottom-6 h-8 w-8 text-brand-yellow/80", r: -8, d: 6.5, delay: -1 },
  { cls: "hidden md:block start-2 top-[44%] h-7 w-7 text-brand-yellow", r: 18, d: 9, delay: -3 },
];

export default function HeroHats() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-hero-hats>
      {HATS.map((h, i) => (
        <ChefHat
          key={i}
          className={h.cls}
          style={{ "--hat-r": `${h.r}deg`, "--hat-d": `${h.d}s`, "--hat-delay": `${h.delay}s` }}
        />
      ))}
    </div>
  );
}
