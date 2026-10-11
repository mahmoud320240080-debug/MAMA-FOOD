import { useEffect, useRef } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

// الرقم الجديد بيطلع من تحت لما يزيد ومن فوق لما يقل (رأسي، فمفيش مشكلة RTL)
const digit = {
  enter: (dir) => ({ y: dir * 14, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: -dir * 14, opacity: 0 }),
};

/**
 * ستيبر كمية (+ / العدد / -)
 * onChange(nextValue, event) — الـ event بيتبعت عشان اللي بيستخدمه يعرف الزرار (مثلاً Fly to Cart)
 */
export default function QuantityStepper({ value, onChange, min = 0, className }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => { prev.current = value; }, [value]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-cream-dark",
        className
      )}
    >
      <button
        type="button"
        onClick={(e) => onChange(Math.max(min, value - 1), e)}
        disabled={value <= min}
        aria-label="أقل"
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-ink/10 active:scale-90 disabled:opacity-40 motion-reduce:active:scale-100"
      >
        <Minus className="h-4 w-4" aria-hidden />
      </button>
      <span className="relative grid h-6 min-w-[28px] overflow-hidden text-center text-base font-bold tabular-nums" aria-live="polite">
        <AnimatePresence initial={false} custom={dir}>
          <m.span
            key={value}
            custom={dir}
            variants={digit}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springs.pop}
            className="col-start-1 row-start-1"
          >
            {value}
          </m.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        onClick={(e) => onChange(value + 1, e)}
        aria-label="أكتر"
        className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-ink/10 active:scale-90 motion-reduce:active:scale-100"
      >
        <Plus className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
