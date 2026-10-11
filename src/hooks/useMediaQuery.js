import { useCallback, useSyncExternalStore } from "react";

/** true لو الـ media query متحققة (بتتحدث مع تغيير المقاس) */
export function useMediaQuery(query) {
  const subscribe = useCallback((cb) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** نفس breakpoint الـ md في Tailwind */
export const useIsDesktop = () => useMediaQuery("(min-width: 768px)");
