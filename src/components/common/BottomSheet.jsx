import { X } from "lucide-react";
import { m, useDragControls } from "framer-motion";
import Overlay from "./Overlay";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

/**
 * موبايل: Sheet بيطلع من تحت، وبيتقفل بالسحب لتحت من المقبض أو العنوان.
 * لاب توب: desktop="center" (Modal في النص) أو desktop="side" (Drawer جانبي، مناسب للسلة).
 */
export default function BottomSheet({ open, onClose, title, children, footer, desktop = "center", className }) {
  const side = desktop === "side";
  const isDesktop = useIsDesktop();
  const drag = useDragControls();
  // الدرور الجانبي على الـ end: في RTL ده الشمال => بيدخل من الشمال (x سالب)
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const reduced = useReducedMotion();
  const hidden = reduced
    ? { opacity: 0 } // تقليل الحركة: fade بس
    : !isDesktop
    ? { opacity: 0, y: "100%" }
    : side
      ? { opacity: 0, x: rtl ? "-100%" : "100%" }
      : { opacity: 0, scale: 0.96 };

  const startDrag = (e) => { if (!isDesktop) drag.start(e); };

  return (
    <Overlay open={open} onClose={onClose} align="end">
      <m.div
        role="dialog" aria-modal="true" aria-label={title}
        initial={hidden}
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        exit={hidden}
        transition={springs.overlay}
        drag={isDesktop ? false : "y"}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose?.(); }}
        className={cn(
          "relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden bg-cream shadow-soft",
          "rounded-t-4xl",
          side
            ? "md:fixed md:inset-y-0 md:end-0 md:max-h-none md:w-[400px] md:rounded-none md:rounded-s-4xl"
            : "md:max-w-lg md:rounded-4xl",
          className)}
      >
        <div onPointerDown={startDrag} className="touch-none md:hidden" aria-hidden>
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-ink/15" />
        </div>
        <header onPointerDown={startDrag} className="flex touch-none items-center justify-between gap-3 px-5 pb-2 pt-3 md:touch-auto">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label="إغلاق"
            className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/5 active:scale-95"><X className="h-6 w-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3">{children}</div>
        {footer && <footer className="border-t border-ink/10 bg-white px-5 pb-safe pt-4"><div className="pb-4">{footer}</div></footer>}
      </m.div>
    </Overlay>
  );
}
