import { createContext, useContext, useRef, useState } from "react";
import { m } from "framer-motion";
import { cardEnter } from "@/lib/motion";

/**
 * دخول الكروت بتتابع خفيف — مرة واحدة بس لما القايمة تظهر أول مرة.
 * جوه RevealGroup: العناصر اللي بتظهر في أول ~450ms من أول عنصر بس هي اللي بتتحرك،
 * فتغيير الفلتر أو الـ re-render ما يعيدش الأنيميشن.
 */
const GroupContext = createContext(null);
const WINDOW_MS = 450;

export function RevealGroup({ children }) {
  const start = useRef(null);
  return <GroupContext.Provider value={start}>{children}</GroupContext.Provider>;
}

export default function Reveal({ as = "div", index = 0, children, ...props }) {
  const group = useContext(GroupContext);
  const [animateIn] = useState(() => {
    if (!group) return true;
    const now = performance.now();
    if (group.current == null) group.current = now;
    return now - group.current < WINDOW_MS;
  });
  const Tag = m[as];
  return (
    <Tag {...props} {...(animateIn ? cardEnter(index) : {})}>
      {children}
    </Tag>
  );
}
