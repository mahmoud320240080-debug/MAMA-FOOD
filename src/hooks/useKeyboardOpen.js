import { useEffect, useState } from "react";

const TEXT_INPUT = 'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"]):not([type="color"]):not([type="file"]), textarea, select, [contenteditable="true"]';

/**
 * true لما كيبورد الموبايل غالباً مفتوح: فيه حقل كتابة عليه focus،
 * أو الـ visualViewport صغر كتير عن الشاشة.
 */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const focused = document.activeElement?.matches?.(TEXT_INPUT) ?? false;
      const shrunk = vv ? window.innerHeight - vv.height > 150 : false;
      setOpen(focused || shrunk);
    };
    // focusout بيحصل قبل ما الـ focus الجديد يتحط => نستنى tick
    const later = () => setTimeout(update, 0);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", later);
    vv?.addEventListener("resize", update);
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", later);
      vv?.removeEventListener("resize", update);
    };
  }, []);
  return open;
}
