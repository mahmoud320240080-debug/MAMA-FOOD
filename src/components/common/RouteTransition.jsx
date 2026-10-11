import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { m } from "framer-motion";
import { pageEnter } from "@/lib/motion";

/**
 * انتقال خفيف بين الصفحات (~220ms، دخول بس — مفيش exit عشان التنقل ما يستناش).
 * أول تحميل للموقع من غير أنيميشن عشان المحتوى (والـ LCP) يظهر على طول.
 */
export default function RouteTransition({ children }) {
  const { pathname } = useLocation();
  const firstPaint = useRef(true);
  useEffect(() => { firstPaint.current = false; }, []);
  return (
    <m.div
      key={pathname}
      initial={firstPaint.current ? false : pageEnter.initial}
      animate={pageEnter.animate}
      transition={pageEnter.transition}
    >
      {children}
    </m.div>
  );
}
