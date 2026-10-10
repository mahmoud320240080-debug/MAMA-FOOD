import { createPortal } from "react-dom";
import { useOverlay } from "@/hooks/useLockBody";

/** الأساس المشترك لـ Modal و BottomSheet: خلفية معتمة + بورتال + Esc */
export default function Overlay({ open, onClose, children, align = "end" }) {
  useOverlay(open, onClose);
  if (!open) return null;
  const alignment = { end: "items-end md:items-center", center: "items-center", start: "items-stretch" }[align];
  return createPortal(
    <div className={`fixed inset-0 z-50 flex justify-center ${alignment}`} role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-ink/60 backdrop-blur-[2px]" onClick={onClose} />
      {children}
    </div>,
    document.body
  );
}
