import { X } from "lucide-react";
import Overlay from "./Overlay";
import { cn } from "@/lib/cn";

/**
 * موبايل: Sheet بيطلع من تحت.
 * لاب توب: desktop="center" (Modal في النص) أو desktop="side" (Drawer جانبي، مناسب للسلة).
 */
export default function BottomSheet({ open, onClose, title, children, footer, desktop = "center", className }) {
  const side = desktop === "side";
  return (
    <Overlay open={open} onClose={onClose} align="end">
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cn(
          "relative z-10 flex max-h-[90dvh] w-full flex-col overflow-hidden bg-cream shadow-soft",
          "animate-sheet-up rounded-t-4xl",
          side
            ? "md:fixed md:inset-y-0 md:end-0 md:max-h-none md:w-[400px] md:animate-side-in md:rounded-none md:rounded-s-4xl"
            : "md:max-w-lg md:animate-pop-in md:rounded-4xl",
          className)}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-ink/15 md:hidden" aria-hidden />
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label="إغلاق"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-ink/5"><X className="h-6 w-6" /></button>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3">{children}</div>
        {footer && <footer className="border-t border-ink/10 bg-white px-5 pb-safe pt-4"><div className="pb-4">{footer}</div></footer>}
      </div>
    </Overlay>
  );
}
