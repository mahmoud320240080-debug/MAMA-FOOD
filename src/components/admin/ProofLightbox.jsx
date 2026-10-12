import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { Download, Maximize2, Minimize2, X } from "lucide-react";
import Overlay from "@/components/common/Overlay";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

const iconBtn = "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-white transition hover:bg-white/10";

/**
 * عرض صورة الإيصال: ملاءمة للشاشة أو "حجم كامل" (بسكرول)، تحميل، وإغلاق.
 * موبايل: الشاشة كلها. Esc والضغط برا بيقفلوا (Overlay)، والـ focus محبوس جوه وبيرجع مكانه بعد القفل.
 */
export default function ProofLightbox({ open, onClose, src, title, downloadName }) {
  const [full, setFull] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const returnFocus = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement;
      closeRef.current?.focus({ preventScroll: true });
      return;
    }
    setFull(false);
    const el = returnFocus.current;
    returnFocus.current = null;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, [open]);

  const trapTab = (e) => {
    if (e.key !== "Tab") return;
    const items = [...dialogRef.current.querySelectorAll('button, a[href], [tabindex="0"]')];
    const i = items.indexOf(document.activeElement);
    e.preventDefault();
    items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
  };

  const hidden = reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 };

  return (
    <Overlay open={open} onClose={onClose} align="start">
      <m.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trapTab}
        initial={hidden}
        animate={{ opacity: 1, scale: 1 }}
        exit={hidden}
        transition={springs.overlay}
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-ink pt-safe md:m-auto md:h-[90dvh] md:max-w-5xl md:rounded-4xl md:pt-0"
      >
        <header className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
          <h2 className="min-w-0 flex-1 truncate px-2 font-bold text-white">{title}</h2>
          <button type="button" onClick={() => setFull((f) => !f)} aria-pressed={full} aria-label={full ? "ملاءمة للشاشة" : "حجم كامل"} className={iconBtn}>
            {full ? <Minimize2 className="h-5 w-5" aria-hidden /> : <Maximize2 className="h-5 w-5" aria-hidden />}
            <span className="hidden sm:inline">{full ? "ملاءمة للشاشة" : "حجم كامل"}</span>
          </button>
          <a href={src} download={downloadName} aria-label="تحميل الصورة" className={iconBtn}>
            <Download className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">تحميل</span>
          </a>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="إغلاق" className={iconBtn}>
            <X className="h-6 w-6" aria-hidden />
          </button>
        </header>
        {/* الحجم الكامل: الصورة بمقاسها والمنطقة بتتسكرل (وبتاخد focus عشان الكيبورد يسكرل) */}
        <div
          tabIndex={full ? 0 : undefined}
          aria-label={full ? "الصورة بالحجم الكامل، اسكرول للتنقل" : undefined}
          className={cn("min-h-0 flex-1 pb-safe", full ? "overflow-auto" : "p-3")}
        >
          <img src={src} alt={title} className={full ? "max-w-none" : "h-full w-full object-contain"} />
        </div>
      </m.div>
    </Overlay>
  );
}
