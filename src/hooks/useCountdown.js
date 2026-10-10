import { useState, useEffect, useCallback } from "react";

/**
 * عد تنازلي بيحدث كل 30 ثانية.
 * @param {string} targetIso - ISO string لوقت القفل
 * @returns {{ hours: number, minutes: number, isExpired: boolean, label: string }}
 */
export function useCountdown(targetIso) {
  const calc = useCallback(() => {
    const diff = new Date(targetIso).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, isExpired: true, label: "اتقفل" };
    const totalMin = Math.floor(diff / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    let label;
    if (hours > 0 && minutes > 0) label = `يقفل بعد ${hours} ساعة و${minutes} دقيقة`;
    else if (hours > 0) label = `يقفل بعد ${hours} ساعة`;
    else label = `يقفل بعد ${minutes} دقيقة`;
    return { hours, minutes, isExpired: false, label };
  }, [targetIso]);

  const [state, setState] = useState(calc);

  useEffect(() => {
    setState(calc());
    const id = setInterval(() => setState(calc()), 30_000);
    return () => clearInterval(id);
  }, [calc]);

  return state;
}
