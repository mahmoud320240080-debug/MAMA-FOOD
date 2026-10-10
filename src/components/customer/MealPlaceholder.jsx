import { LogoIcon } from "@/components/common/Logo";
import { cn } from "@/lib/cn";

/**
 * بليسهولدر مكان صورة الوجبة لما ما يكونش فيه صورة
 */
export default function MealPlaceholder({ className }) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-gradient-to-br from-brand-red to-brand-red-dark",
        className
      )}
      aria-hidden
    >
      <LogoIcon tone="onRed" className="w-12 opacity-60" />
    </div>
  );
}
