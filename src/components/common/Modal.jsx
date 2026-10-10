import { X } from "lucide-react";
import Overlay from "./Overlay";
import { cn } from "@/lib/cn";

/** Modal في النص. fullOnMobile = بياخد الشاشة كلها على الموبايل (للفورمز في الأدمن) */
export default function Modal({ open, onClose, title, children, footer, fullOnMobile = false, size = "md" }) {
  const widths = { sm: "md:max-w-sm", md: "md:max-w-lg", lg: "md:max-w-2xl" };
  return (
    <Overlay open={open} onClose={onClose} align={fullOnMobile ? "start" : "center"}>
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className={cn(
          "relative z-10 flex w-full animate-pop-in flex-col overflow-hidden bg-cream shadow-soft",
          fullOnMobile
            ? "h-dvh md:my-auto md:h-auto md:max-h-[90dvh] md:rounded-4xl"
            : "m-4 max-h-[90dvh] rounded-4xl",
          widths[size])}
      >
        <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4 pt-safe">
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
