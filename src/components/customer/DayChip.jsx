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
        "group relative flex w-40 shrink-0 snap-start flex-col items-center overflow-hidden rounded-3xl border-2 px-3 pb-3 pt-5 text-center xl:px-2 transition-[background-color,border-color,box-shadow,color,opacity]",
        "sm:w-44 md:w-auto",
        disabled
          ? "cursor-not-allowed border-ink/10 opacity-55"
          : selected
            ? "border-brand-red bg-brand-red text-white shadow-pop"
            : "border-ink/10 bg-white hover:border-brand-red hover:shadow-soft"
      )}
    >
      {/* أيقونة الحالة في الركن (برّه مجرى النص عشان المحتوى يفضل في النص بالظبط) */}
      {selected && !disabled && (
        <span className="absolute start-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-white text-brand-red">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
        </span>
      )}
      {closed && (
        <span className="absolute start-2.5 top-2.5 grid h-6 w-6 place-items-center text-ink-soft">
          <Lock className="h-4 w-4" aria-hidden />
        </span>
      )}

      <h3 className="text-lg font-extrabold leading-tight">{day.dayName}</h3>
      <p
        className={cn(
          "mt-1 text-sm",
          selected && !disabled ? "text-white/80" : "text-ink-soft"
        )}
      >
        {formatDayMonth(day.date)}
      </p>

      {/* مكان ثابت لبادج "النهارده" في كل الكروت، عشان عدد الوجبات والبيل يقفوا على نفس الخط */}
      <div className="mt-2 flex h-6 items-center justify-center">
        {day.isToday && (
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">النهارده</span>
        )}
      </div>

      {noMeals ? (
        <p className="mt-1 text-sm text-ink-soft">مفيش وجبات في اليوم ده</p>
      ) : (
        <p
          className={cn(
            "mt-1 text-sm font-bold",
            selected && !disabled ? "text-brand-yellow" : "text-brand-red"
          )}
        >
          {day.meals.length} وجبة
        </p>
      )}

      {/* البيل تحت خالص بعرض الكارت */}
      <div className="mt-auto w-full pt-3">
        {closed ? (
          <span className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-ink/10 px-2.5 py-2 text-xs font-semibold text-ink-soft">
            مقفول
          </span>
        ) : (
          !noMeals && (
            <CountdownBadge
              closesAt={day.closesAt}
              block
              shortMinutes
              className={cn(selected && "bg-white/20 text-white")}
            />
          )
        )}
      </div>
    </m.button>
  );
}
