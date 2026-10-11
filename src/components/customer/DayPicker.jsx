import DayChip from "./DayChip";
import Skeleton from "@/components/common/Skeleton";
import { cn } from "@/lib/cn";

// موبايل: شريط بسكرول أفقي (snap). تابلت/لاب توب صغير: صفين × 4. شاشة كبيرة: الـ 8 كروت في صف واحد
const STRIP = "scroll-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 xl:grid-cols-8";
const CARD_W = "w-40 shrink-0 sm:w-44 md:w-auto";

/**
 * شريط اختيار الأيام: النهارده + الـ 7 أيام الجاية من بكره (كلهم جايين من menuApi.getUpcoming)
 */
export default function DayPicker({
  days,
  isLoading,
  selectedDates,
  onToggle,
}) {
  if (isLoading) {
    return (
      <div className={STRIP}>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className={cn("h-40", CARD_W)} />
        ))}
      </div>
    );
  }

  return (
    <div className={STRIP}>
      {days.map((day) => (
        <DayChip
          key={day.date}
          day={day}
          selected={selectedDates.includes(day.date)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
