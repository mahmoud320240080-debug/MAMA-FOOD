import { LogoIcon } from "./Logo";
import { cn } from "@/lib/cn";

/** لودر الصفحات اللي بتتحمّل lazy: أيقونة M بتنبض (ثابتة مع "تقليل الحركة") */
export default function PageLoader({ className }) {
  return (
    <div role="status" className={cn("grid place-items-center", className)}>
      <LogoIcon tone="onLight" className="w-16 animate-pulse motion-reduce:animate-none" />
      <span className="sr-only">بيحمّل...</span>
    </div>
  );
}
