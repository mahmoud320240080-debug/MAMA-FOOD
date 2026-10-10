import { cn } from "@/lib/cn";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, Lock } from "lucide-react";

/**
 * بادج العد التنازلي لقفل اليوم
 */
export default function CountdownBadge({ closesAt, className }) {
  const { isExpired, label } = useCountdown(closesAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        isExpired
          ? "bg-ink/10 text-ink-soft"
          : "bg-brand-yellow-soft text-ink",
        className
      )}
    >
      {isExpired ? (
        <Lock className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Clock className="h-3.5 w-3.5" aria-hidden />
      )}
      {label}
    </span>
  );
}
