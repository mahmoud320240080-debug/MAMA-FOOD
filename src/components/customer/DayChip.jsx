import { m } from "framer-motion";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { Check, Lock } from "lucide-react";
import { useCountdown } from "@/hooks/useCountdown";
import CountdownBadge from "./CountdownBadge";

// pop صغير لما اليوم يتختار (scale بس — مع "تقليل الحركة" Framer بيلغيه)
const pop = { on: { scale: [1, 1.06, 1], transition: { duration: 0.32 } }, off: { scale: 1 } };

/**
 * شريحة يوم (النهارده أو يوم من الأيام الجاية).
 * القفل لايف: لو ميعاد القفل (closesAt من getDayLockTime) جه والصفحة مفتوحة، الكارت بيتقفل في نفس اللحظة من غير ريفريش.
 */
export default function DayChip({
  day,
  selected,
  onToggle,
}) {
  const { isExpired } = useCountdown(day.closesAt);
  const closed = day.isClosed || isExpired;
  const noMeals = day.meals.length === 0;
  const disabled = closed || noMeals;

  return (
    <m.button
      type="button"
      variants={pop}
      initial={false}
      animate={selected ? "on" : "off"}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={() => !disabled && onToggle(day.date)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-3xl border-2 text-start transition-[background-color,border-color,box-shadow,color,opacity]",
        "sm:w-44 md:w-auto",
        disabled
          ? "cursor-not-allowed border-ink/10 opacity-55"
          : selected
            ? "border-brand-red bg-brand-red text-white shadow-pop"
            : "border-ink/10 bg-white hover:border-brand-red hover:shadow-soft"
      )}
    >
      {/* الهيدر */}
      <div className="px-4 pb-2 pt-4 xl:px-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{day.dayName}</h3>
          {selected && !disabled && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-brand-red">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
            </span>
          )}
          {closed && (
            <Lock className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
          )}
        </div>
        <p
          className={cn(
            "text-sm",
            selected && !disabled ? "text-white/80" : "text-ink-soft"
          )}
        >
          {formatDayMonth(day.date)}
        </p>
      </div>

      {/* محتوى */}
      <div className="flex flex-1 flex-col items-start gap-2 px-4 pb-4 pt-1 xl:px-3">
        {day.isToday && (
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">النهارده</span>
        )}
        {noMeals ? (
          <p className="text-sm text-ink-soft">مفيش وجبات في اليوم ده</p>
        ) : (
          <p
            className={cn(
              "text-sm font-semibold",
              selected && !disabled ? "text-brand-yellow" : "text-brand-red"
            )}
          >
            {day.meals.length} وجبة
          </p>
        )}

        {closed ? (
          <span className="mt-auto inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink-soft">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            مقفول
          </span>
        ) : (
          !noMeals && (
            <CountdownBadge
              closesAt={day.closesAt}
              block
              className={cn(
                "mt-auto",
                selected && "bg-white/20 text-white"
              )}
            />
          )
        )}
      </div>
    </m.button>
  );
}
