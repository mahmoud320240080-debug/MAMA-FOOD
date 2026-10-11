import { useState, useEffect, useCallback } from "react";
import { formatCountdown } from "@/lib/dates";

/**
 * عد تنازلي لوقت القفل. بيتحدث كل 30 ثانية، وكل ثانية في آخر دقيقتين
 * عشان "أقل من دقيقة" والقفل نفسه يظهروا في وقتهم.
 * @param {string} targetIso - ISO string لوقت القفل
 * @returns {{ isExpired: boolean, label: string }}
 */
export function useCountdown(targetIso) {
  const calc = useCallback(() => {
    const diff = new Date(targetIso).getTime() - Date.now();
    if (diff <= 0) return { diff, isExpired: true, label: "اتقفل" };
    return { diff, isExpired: false, label: formatCountdown(diff) };
  }, [targetIso]);

  const [state, setState] = useState(calc);

  useEffect(() => {
    let id;
    const tick = () => {
      const next = calc();
      setState(next);
      if (!next.isExpired) id = setTimeout(tick, next.diff < 120_000 ? 1000 : 30_000);
    };
    tick();
    return () => clearTimeout(id);
  }, [calc]);

  return state;
}
