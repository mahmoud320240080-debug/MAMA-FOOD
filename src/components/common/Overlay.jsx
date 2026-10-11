import { createPortal } from "react-dom";
import { AnimatePresence, m, useIsPresent } from "framer-motion";
import { useOverlay } from "@/hooks/useLockBody";
import { fade } from "@/lib/motion";

const alignments = { end: "items-end md:items-center", center: "items-center", start: "items-stretch" };

function Frame({ align, onClose, children }) {
  // وقت أنيميشن القفل: ما يمسكش الكليكات عشان ما يأخرش المستخدم
  const isPresent = useIsPresent();
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${alignments[align]}`}
      role="presentation"
      style={isPresent ? undefined : { pointerEvents: "none" }}
    >
      <m.div
        className="absolute inset-0 bg-ink/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={fade}
        onClick={onClose}
      />
      {children}
    </div>
  );
}

/** الأساس المشترك لـ Modal و BottomSheet والدرور: خلفية معتمة + بورتال + Esc + أنيميشن فتح/قفل */
export default function Overlay({ open, onClose, children, align = "end" }) {
  useOverlay(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && <Frame key="overlay" align={align} onClose={onClose}>{children}</Frame>}
    </AnimatePresence>,
    document.body
  );
}
