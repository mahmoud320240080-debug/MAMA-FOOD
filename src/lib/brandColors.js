/**
 * ألوان الهوية — المصدر الوحيد. tailwind.config.js بياخدها من هنا (bg-brand-red ...)،
 * والأماكن اللي محتاجة اللون في JS (Fly to Cart، الكونفيتي، الشارتس) بتستوردها من هنا برضه.
 * تغيير الأحمر في كل الموقع = تغيير سطر واحد.
 */
export const BRAND_COLORS = {
  red: "#ED1B24", // rgb(237, 27, 36)
  redDark: "#C4141B", // hover بس
  yellow: "#FFDE17",
  yellowSoft: "#FFF3A6",
  ink: "#2B1B17",
  inkSoft: "#6B5650",
  cream: "#FFFBEA",
  creamDark: "#F6EFD0",
};

/** "#ED1B24" + 0.45 => "rgba(237,27,36,0.45)" */
export const withAlpha = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};
