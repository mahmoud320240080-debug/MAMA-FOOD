import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * صف شرايح فلترة: موبايل = سكرول أفقي داخلي (من غير سكرول للصفحة)، تابلت ولاب توب = بتلف على أكتر من سطر.
 * options: [{ value, label, count? }]
 */
export default function FilterChips({ label, options, value, onChange }) {
  const ref = useRef(null);

  // خلي الشريحة المختارة باينة جوه الصف
  useEffect(() => {
    const el = ref.current?.querySelector('[aria-pressed="true"]');
    const row = ref.current;
    if (!el || !row || row.scrollWidth <= row.clientWidth) return;
    const elBox = el.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    if (elBox.left < rowBox.left || elBox.right > rowBox.right) {
      row.scrollLeft += elBox.left + elBox.width / 2 - (rowBox.left + rowBox.width / 2);
    }
  }, [value]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className="scroll-snap-x -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-4 text-sm font-bold transition active:scale-[.98]",
              active
                ? "border-brand-red bg-brand-red text-white"
                : "border-ink/10 bg-white text-ink hover:border-brand-red"
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn("grid min-w-[22px] place-items-center rounded-full px-1.5 text-xs",
                active ? "bg-white/25 text-white" : "bg-ink/10 text-ink")}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
