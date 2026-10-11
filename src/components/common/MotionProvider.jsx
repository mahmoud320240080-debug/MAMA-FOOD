import { LazyMotion, MotionConfig } from "framer-motion";

// الفيتشرز (domMax: أنيميشن + exit + drag) بتتحمّل async في chunk منفصل
const loadFeatures = () => import("@/lib/motionFeatures").then((m) => m.default);

/**
 * غلاف الحركة للتطبيق كله:
 * - LazyMotion strict: لازم نستخدم m.* (أخف بكتير من motion.*)
 * - reducedMotion="user": مع "تقليل الحركة" Framer بيلغي حركات الـ transform ويسيب الـ opacity
 */
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
