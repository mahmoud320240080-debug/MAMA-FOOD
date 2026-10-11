import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/** قسم "اختار أيامك" في الرئيسية (زرار الهيرو وزرار الناف بار بيودوا عليه) */
export const DAYS_SECTION_ID = "days";

/**
 * سكرول ناعم لقسم (فوري مع "تقليل الحركة"). مكانه تحت الناف بار الثابت بيتظبط بـ scroll-margin-top على القسم.
 * الـ focus بيروح لعنوان القسم عشان قارئ الشاشة والكيبورد يكملوا من هناك.
 */
export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  el.querySelector("h2")?.focus({ preventScroll: true });
}
