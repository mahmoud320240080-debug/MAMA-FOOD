import { cn } from "@/lib/cn";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, Lock } from "lucide-react";

/**
 * بادج العد التنازلي لقفل اليوم
 * block: بعرض الكارت كله (كروت الأيام الضيقة): النص بيتقسم على سطرين متوازنين،
 * وفي صف الـ 8 كروت (xl) الأيقونة بتستخبى عشان الكلام ياخد المساحة
 */
export default function CountdownBadge({ closesAt, block = false, className }) {
  const { isExpired, label } = useCountdown(closesAt);

  return (
    <span
      className={cn(
        "items-center gap-1.5 text-xs font-semibold",
        block ? "flex w-full rounded-2xl px-2.5 py-1.5 xl:px-2 xl:[&>svg]:hidden" : "inline-flex rounded-full px-3 py-1",
        isExpired
          ? "bg-ink/10 text-ink-soft"
          : "bg-brand-yellow-soft text-ink",
        className
      )}
    >
      {isExpired ? (
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
      )}
      <span className="text-balance">{label}</span>
    </span>
  );
}
