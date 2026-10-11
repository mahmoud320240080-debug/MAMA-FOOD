import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { BRAND_COLORS } from "./src/lib/brandColors.js";

export default defineConfig({
  plugins: [
    react(),
    /**
     * PWA: manifest + service worker بيكاش واجهة الموقع وملفاته الثابتة بس (JS/CSS/صور/خطوط).
     * الداتا (الطلبات والمنيو) في localStorage ومع الباك الحقيقي على VITE_API_URL — مفيش كاش ليها خالص
     * => عمر ما الأدمن يشوف طلبات أو منيو قديمة. في الـ dev الـ service worker مقفول.
     * autoUpdate: نسخة جديدة بتتحمّل في الخلفية وتشتغل في الزيارة الجاية.
     */
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.png"],
      manifest: {
        name: "MAMA FOOD",
        short_name: "MAMA FOOD",
        description: "MAMA FOOD - أكل بيتي. اختار أيامك ووجباتك واطلب.",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: BRAND_COLORS.red,
        background_color: BRAND_COLORS.cream,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        // الصفحات (/checkout، /admin/...) بتفتح offline من نفس الـ index.html
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // خطوط Google ملفات ثابتة => تتكاش. مفيش أي caching لـ API
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
