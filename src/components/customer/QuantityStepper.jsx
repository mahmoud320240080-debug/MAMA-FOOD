import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * ستيبر كمية (+ / العدد / -)
 */
export default function QuantityStepper({ value, onChange, min = 0, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-cream-dark",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="أقل"
        className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-ink/10 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="min-w-[28px] text-center text-base font-bold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label="أكتر"
        className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-ink/10"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
