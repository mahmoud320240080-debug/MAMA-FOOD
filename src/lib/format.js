export const formatPrice = (n) => `${Number(n || 0).toLocaleString("en-US")} جنيه`;

/** "10 أكتوبر، 9:30 م" */
export const formatDateTime = (iso) =>
  new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

/** ساعة من 0 لـ 23 => "10 م" / "12 ص" */
export const formatHour = (h) => `${h % 12 || 12} ${h < 12 ? "ص" : "م"}`;

/** ساعة بكلام => "12 ظهرًا" / "10 مساءً" / "9 صباحًا" / "12 منتصف الليل" */
export const formatHourPhrase = (h) => {
  if (h === 0) return "12 منتصف الليل";
  const period = h < 12 ? "صباحًا" : h < 16 ? "ظهرًا" : h < 18 ? "عصرًا" : "مساءً";
  return `${h % 12 || 12} ${period}`;
};

/** حساب الوقت المنقضي منذ الإنشاء */
export const formatTimeAgo = (iso) => {
  if (!iso) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "الآن";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return diffHours === 1 ? "منذ ساعة" : diffHours === 2 ? "منذ ساعتين" : `منذ ${diffHours} ساعات`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "منذ يوم" : diffDays === 2 ? "منذ يومين" : `منذ ${diffDays} أيام`;
};
