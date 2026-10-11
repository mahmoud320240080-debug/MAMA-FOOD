import { prefersReducedMotion } from "@/hooks/useReducedMotion";

/**
 * اهتزاز خفيف على الموبايل (إضافة للسلة، اختيار يوم، تأكيد الطلب).
 * iOS Safari مش بيدعمه => مش بيعمل حاجة، وده عادي. مع "تقليل الحركة" مفيش اهتزاز.
 */
export function haptic(pattern = 10) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (prefersReducedMotion()) return;
  try { navigator.vibrate(pattern); } catch { /* بعض المتصفحات بترفض من غير تفاعل */ }
}
