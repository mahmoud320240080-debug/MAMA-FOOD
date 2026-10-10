import { DAY_KEYS, DAY_NAMES_AR, UPCOMING_DAYS_COUNT } from "./constants";

const pad = (n) => String(n).padStart(2, "0");

/** تاريخ محلي بصيغة YYYY-MM-DD (من غير مشاكل الـ timezone بتاعت toISOString) */
export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** الأيام من بكره لحد +count (النهاردة السبت => الأحد ... السبت الجاي) */
export function getUpcomingDates(count = UPCOMING_DAYS_COUNT, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i + 1);
    const dayKey = DAY_KEYS[d.getDay()];
    return { date: toDateKey(d), dayKey, dayName: DAY_NAMES_AR[dayKey], jsDate: d };
  });
}

/** ميعاد قفل اليوم = الساعة cutoffHour مساءً في اليوم اللي قبله */
export const getCutoffTime = (dateKey, cutoffHour = 22) => {
  const d = fromDateKey(dateKey);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, cutoffHour, 0, 0);
};

export const isDayClosed = (dateKey, cutoffHour = 22, now = new Date()) =>
  now.getTime() >= getCutoffTime(dateKey, cutoffHour).getTime();

const fmtDayMonth = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long" });
export const formatDayMonth = (dateKey) => fmtDayMonth.format(fromDateKey(dateKey));
