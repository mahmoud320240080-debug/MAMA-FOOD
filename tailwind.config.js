import { BRAND_COLORS as C, withAlpha } from "./src/lib/brandColors.js";

/** هوية MAMA FOOD: أحمر + أصفر + بني دافي + كريمي (القيم في src/lib/brandColors.js) */
export default {
  // الموقع فاتح دايماً (مفيش dark mode). "class" من غير ما نحط الكلاس = أي dark: مش هيشتغل أبداً
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: C.red,
          "red-dark": C.redDark,
          yellow: C.yellow,
          "yellow-soft": C.yellowSoft,
        },
        ink: { DEFAULT: C.ink, soft: C.inkSoft },
        cream: { DEFAULT: C.cream, dark: C.creamDark },
      },
      fontFamily: {
        display: ['"Baloo Bhaijaan 2"', "Cairo", "system-ui", "sans-serif"],
        body: ["Cairo", "Tajawal", "system-ui", "sans-serif"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: { "2xl": "1.25rem", "3xl": "1.75rem", "4xl": "2.25rem" },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(43,27,23,.22)",
        pop: `0 14px 40px -12px ${withAlpha(C.red, 0.45)}`,
      },
    },
  },
  plugins: [],
};
