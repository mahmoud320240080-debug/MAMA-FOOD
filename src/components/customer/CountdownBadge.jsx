import { cn } from "@/lib/cn";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, Lock } from "lucide-react";

/**
 * بادج العد التنازلي لقفل اليوم
 * block: بعرض الكارت كله (كروت الأيام الضيقة): متسنتر وبارتفاع ثابت، والنص بيتقسم على سطرين متوازنين،
 * والأيقونة بتستخبى عشان الكلام ياخد عرض الكارت كله ومايعديش سطرين
 */
export default function CountdownBadge({ closesAt, block = false, shortMinutes = false, className }) {
  const { isExpired, label } = useCountdown(closesAt, { shortMinutes });

  return (
    <span
      className={cn(
        "items-center gap-1.5 text-xs font-semibold",
        block ? "flex min-h-12 w-full justify-center rounded-2xl px-2 py-2 text-center leading-4 xl:px-1 [&>svg]:hidden" : "inline-flex rounded-full px-3 py-1",
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
