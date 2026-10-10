import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDayMonth } from "@/lib/dates";
import { useCartStore } from "@/store/useCartStore";
import CountdownBadge from "./CountdownBadge";
import MealCard from "./MealCard";

/**
 * أكورديون يوم — بيعرض وجبات يوم معين مع هيدر فيه اسم اليوم والتاريخ والعد التنازلي
 */
export default function DayAccordion({ day, isOpen, onToggle, onAddonsClick }) {
  const items = useCartStore((s) => s.items);
  const dayItems = items.filter((it) => it.date === day.date);
  const mealsCount = dayItems.length;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
      {/* هيدر */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`day-panel-${day.date}`}
        className="flex w-full min-h-[56px] items-center gap-3 px-5 py-4 text-start transition hover:bg-cream-dark"
      >
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{day.dayName}</h3>
            <span className="text-sm text-ink-soft">{formatDayMonth(day.date)}</span>
            {mealsCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-bold text-white">
                تم اختيار {mealsCount} وجبة
              </span>
            )}
          </div>
          <CountdownBadge closesAt={day.closesAt} className="mt-1" />
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-ink-soft transition-transform",
            isOpen && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {/* البانل */}
      <div
        id={`day-panel-${day.date}`}
        role="region"
        className={cn(
          "grid transition-all duration-200",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-ink/5 p-4 md:p-5">
            {day.meals.length === 0 ? (
              <p className="py-6 text-center text-ink-soft">
                مفيش وجبات في اليوم ده
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {day.meals.map((meal) => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    date={day.date}
                    onAddonsClick={onAddonsClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
