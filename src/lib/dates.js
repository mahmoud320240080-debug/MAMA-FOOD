import { DAY_KEYS, DAY_NAMES_AR, UPCOMING_DAYS_COUNT } from "./constants";

const pad = (n) => String(n).padStart(2, "0");

/** تاريخ محلي بصيغة YYYY-MM-DD (من غير مشاكل الـ timezone بتاعت toISOString) */
export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * كل الحسابات بالتاريخ المحلي للجهاز (getFullYear/getDate...) مش UTC،
 * فجهاز على توقيت القاهرة (Africa/Cairo) بيشوف أيام القاهرة بالظبط حتى بعد نص الليل على طول.
 * offset أيام من النهارده: 0 = النهارده، 1 = بكره ...
 */
function dayInfo(offset, from) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset);
  const dayKey = DAY_KEYS[d.getDay()];
  return { date: toDateKey(d), dayKey, dayName: DAY_NAMES_AR[dayKey], jsDate: d };
}

/** الأيام من بكره لحد +count (النهاردة السبت => الأحد ... السبت الجاي) */
export function getUpcomingDates(count = UPCOMING_DAYS_COUNT, from = new Date()) {
  return Array.from({ length: count }, (_, i) => dayInfo(i + 1, from));
}

/** النهارده (مفتوح أو مقفول حسب isDayLocked) */
export const getToday = (from = new Date()) => dayInfo(0, from);

/** الأسبوع الحالي: من الأحد للسبت (نفس ترتيب القالب الأسبوعي DAY_KEYS) اللي فيه النهارده */
export const getCurrentWeek = (from = new Date()) =>
  Array.from({ length: 7 }, (_, i) => dayInfo(i - from.getDay(), from));

/**
 * جمع الأعداد بالعربي: 1 => "ساعة"، 2 => "ساعتين"، 3-10 => "N ساعات"، 11+ => "N ساعة"
 * forms: [مفرد, مثنى, جمع (3-10), مفرد مع 11+]
 * بين الرقم والكلمة مسافة مش بتتكسر (NBSP) => الرقم عمره ما ينزل سطر لوحده في الكروت الضيقة
 */
const NBSP = String.fromCharCode(160);
const pluralAr = (n, [one, two, few, many]) =>
  n === 1 ? one : n === 2 ? two : `${n}${NBSP}${n <= 10 ? few : many}`;
const DAYS = ["يوم", "يومين", "أيام", "يوم"];
const HOURS = ["ساعة", "ساعتين", "ساعات", "ساعة"];
const MINUTES = ["دقيقة", "دقيقتين", "دقائق", "دقيقة"];

/**
 * نص العد التنازلي لقفل اليوم (ms = الوقت الباقي بالمللي ثانية):
 * - 24 ساعة أو أكتر: أيام + الساعات الباقية لو مش صفر => "يقفل بعد 6 أيام و18 ساعة" / "يقفل بعد 3 أيام"
 * - أقل من 24 ساعة: ساعات + دقايق => "يقفل بعد 5 ساعات و20 دقيقة"
 * - أقل من ساعة: دقايق بس. أقل من دقيقة: "يقفل بعد أقل من دقيقة"
 * الأرقام بتتقرّب لتحت (عمرنا ما نقول وقت أكتر من الحقيقي).
 * shortMinutes (بيل كروت الأيام في الرئيسية بس): الدقايق "د" ومن غير "و" => "يقفل بعد 18 ساعة 5 د"
 */
export function formatCountdown(ms, { shortMinutes = false } = {}) {
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return "يقفل بعد أقل من دقيقة";
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days === 0 && shortMinutes) {
    const parts = [hours > 0 && pluralAr(hours, HOURS), minutes > 0 && `${minutes}${NBSP}د`];
    return `يقفل بعد ${parts.filter(Boolean).join(" ")}`;
  }
  const parts = days > 0
    ? [pluralAr(days, DAYS), hours > 0 && pluralAr(hours, HOURS)]
    : [hours > 0 && pluralAr(hours, HOURS), minutes > 0 && pluralAr(minutes, MINUTES)];
  return `يقفل بعد ${parts.filter(Boolean).join(" و")}`;
}

/**
 * ميعاد قفل الطلب ليوم — المكان الوحيد اللي فيه حساب القفل في المشروع كله.
 * settings: { cutoffMode, orderCutoffHour }
 * - "same_day": اليوم بيتقفل الساعة orderCutoffHour في نفس اليوم (12 => الأحد بيتقفل الأحد 12 الضهر)
 * - "day_before": بيتقفل الساعة orderCutoffHour في اليوم اللي قبله (22 => الأحد بيتقفل السبت 10 بالليل)
 */
export const getDayLockTime = (dateKey, { cutoffMode, orderCutoffHour }) => {
  const d = fromDateKey(dateKey);
  const dayOffset = cutoffMode === "day_before" ? -1 : 0;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayOffset, orderCutoffHour, 0, 0);
};

/** اليوم اتقفل؟ (من أول ثانية في ميعاد القفل) */
export const isDayLocked = (dateKey, now, settings) => now.getTime() >= getDayLockTime(dateKey, settings).getTime();

/** الأيام المقفولة من قايمة تواريخ (للسلة والـ Checkout والـ createOrder) */
export const getLockedDates = (dateKeys, settings, now = new Date()) =>
  [...new Set(dateKeys)].sort().filter((d) => isDayLocked(d, now, settings));

const fmtDayMonth = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long" });
export const formatDayMonth = (dateKey) => fmtDayMonth.format(fromDateKey(dateKey));

/** "الأحد 11 أكتوبر" */
export const formatDayLabel = (dateKey) =>
  `${DAY_NAMES_AR[DAY_KEYS[fromDateKey(dateKey).getDay()]]} ${formatDayMonth(dateKey)}`;

/** "ل" + اسم اليوم: "الأحد" => "للأحد" (لام الجر مع "ال" بتشيل الألف) */
export const withLam = (dayName = "") => (dayName.startsWith("ال") ? `ل${dayName.slice(1)}` : `لـ${dayName}`);
