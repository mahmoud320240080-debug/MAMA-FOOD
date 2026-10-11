import { m } from "framer-motion";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * بادج عدد السلة (أصفر والرقم بني). الرقم بيعمل pop لما يتغير
 * (مع "تقليل الحركة" Framer بيسيب الـ fade بس).
 */
export default function CartCountBadge({ count, className }) {
  if (!count) return null;
  return (
    <m.span
      key={count}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.pop}
      className={cn(
        "grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-yellow px-1 text-xs font-bold tabular-nums text-ink shadow-sm",
        className
      )}
    >
      {count}
    </m.span>
  );
}
