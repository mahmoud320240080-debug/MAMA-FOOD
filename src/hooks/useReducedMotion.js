import { useSyncExternalStore } from "react";

/**
 * تقليل الحركة: مصدر واحد لأي حاجة مش Framer Motion (Lottie، CSS، الاهتزاز، Fly to Cart).
 * Framer نفسه بيتعامل معاها من MotionConfig reducedMotion="user".
 */
const QUERY = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches;

const subscribe = (cb) => {
  const mq = window.matchMedia?.(QUERY);
  mq?.addEventListener("change", cb);
  return () => mq?.removeEventListener("change", cb);
};

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
