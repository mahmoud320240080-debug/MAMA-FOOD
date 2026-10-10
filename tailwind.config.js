/** هوية MAMA FOOD: أحمر + أصفر + بني دافي + كريمي */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ED1C24",
          "red-dark": "#C4141B",
          yellow: "#FFDE17",
          "yellow-soft": "#FFF3A6",
        },
        ink: { DEFAULT: "#2B1B17", soft: "#6B5650" },
        cream: { DEFAULT: "#FFFBEA", dark: "#F6EFD0" },
      },
      fontFamily: {
        display: ['"Baloo Bhaijaan 2"', "Cairo", "system-ui", "sans-serif"],
        body: ["Cairo", "Tajawal", "system-ui", "sans-serif"],
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
      borderRadius: { "2xl": "1.25rem", "3xl": "1.75rem", "4xl": "2.25rem" },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(43,27,23,.22)",
        pop: "0 14px 40px -12px rgba(237,28,36,.45)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "side-in": { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
        "drawer-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "pop-in": { from: { opacity: 0, transform: "scale(.96)" }, to: { opacity: 1, transform: "scale(1)" } },
        "toast-in": { from: { opacity: 0, transform: "translateY(-12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "fade-in": "fade-in .2s ease-out",
        "sheet-up": "sheet-up .28s cubic-bezier(.2,.8,.2,1)",
        "side-in": "side-in .28s cubic-bezier(.2,.8,.2,1)",
        "drawer-in": "drawer-in .28s cubic-bezier(.2,.8,.2,1)",
        "pop-in": "pop-in .2s ease-out",
        "toast-in": "toast-in .25s ease-out",
      },
    },
  },
  plugins: [],
};
