import { X } from "lucide-react";
import { m } from "framer-motion";
import Overlay from "./Overlay";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** Modal في النص. fullOnMobile = بياخد الشاشة كلها على الموبايل (للفورمز في الأدمن) */
export default function Modal({ open, onClose, title, children, footer, fullOnMobile = false, size = "md" }) {
  const widths = { sm: "md:max-w-sm", md: "md:max-w-lg", lg: "md:max-w-2xl" };
  const isDesktop = useIsDesktop();
  const reduced = useReducedMotion();
  // فل سكرين على الموبايل: بيطلع من تحت شوية. غير كده: scale خفيف. تقليل الحركة: fade بس
  const hidden = reduced ? { opacity: 0 } : fullOnMobile && !isDesktop ? { opacity: 0, y: 24 } : { opacity: 0, scale: 0.96 };
  return (
    <Overlay open={open} onClose={onClose} align={fullOnMobile ? "start" : "center"}>
      <m.div
        role="dialog" aria-modal="true" aria-label={title}
        initial={hidden}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={hidden}
        transition={springs.overlay}
        className={cn(
          "relative z-10 flex w-full flex-col overflow-hidden bg-cream shadow-soft",
          fullOnMobile
            ? "h-dvh md:my-auto md:h-auto md:max-h-[90dvh] md:rounded-4xl"
            : "m-4 max-h-[90dvh] rounded-4xl",
          widths[size])}
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4 pt-safe">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق"
            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/5 active:scale-95"><X className="h-6 w-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3">{children}</div>
        {footer && <footer className="border-t border-ink/10 bg-white px-5 pb-safe pt-4"><div className="pb-4">{footer}</div></footer>}
      </m.div>
    </Overlay>
  );
}
