import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { Check, Lock } from "lucide-react";
import CountdownBadge from "./CountdownBadge";

/**
 * شريحة يوم (للاختيار من الأيام الجاية)
 */
export default function DayChip({
  day,
  selected,
  onToggle,
}) {
  const noMeals = day.meals.length === 0;
  const disabled = day.isClosed || noMeals;

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(day.date)}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-w-[140px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border-2 text-start transition-all",
        "sm:min-w-[160px] md:min-w-0",
        disabled
          ? "cursor-not-allowed border-ink/10 opacity-55"
          : selected
            ? "border-brand-red bg-brand-red text-white shadow-pop"
            : "border-ink/10 bg-white hover:border-brand-red hover:shadow-soft"
      )}
    >
      {/* الهيدر */}
      <div className="px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold">{day.dayName}</h3>
          {selected && !disabled && (
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-brand-red">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
            </span>
          )}
          {day.isClosed && (
            <Lock className="h-4 w-4 text-ink-soft" aria-hidden />
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
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-1">
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

        {!day.isClosed && !noMeals && (
          <CountdownBadge
            closesAt={day.closesAt}
            className={cn(
              "mt-auto self-start",
              selected && "bg-white/20 text-white"
            )}
          />
        )}
      </div>
    </button>
  );
}
