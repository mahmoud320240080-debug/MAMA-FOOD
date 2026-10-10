import DayChip from "./DayChip";
import Skeleton from "@/components/common/Skeleton";

/**
 * شريط اختيار الأيام — سكرول أفقي على الموبايل، جريد على الديسكتوب
 */
export default function DayPicker({
  days,
  isLoading,
  selectedDates,
  onToggle,
}) {
  if (isLoading) {
    return (
      <div className="scroll-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-40 min-w-[140px] shrink-0 sm:min-w-[160px] md:min-w-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="scroll-snap-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-7">
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
