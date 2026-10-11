import { CalendarDays, ClipboardList, LayoutDashboard, Plus, Settings, UtensilsCrossed } from "lucide-react";

/**
 * صفحات الأدمن — مصدر واحد للسايدبار والـ Command Palette.
 * keywords: كلمات زيادة للبحث (إنجليزي ومرادفات)
 */
export const ADMIN_PAGES = [
  { to: "/admin/dashboard", label: "نظرة عامة", Icon: LayoutDashboard, keywords: "dashboard overview home stats الرئيسية احصائيات داشبورد" },
  { to: "/admin/menu", label: "المنيو الأسبوعي", Icon: CalendarDays, keywords: "weekly menu المنيو" },
  { to: "/admin/meals", label: "الوجبات", Icon: UtensilsCrossed, keywords: "meals food اكل" },
  { to: "/admin/addons", label: "الإضافات", Icon: Plus, keywords: "addons extras" },
  { to: "/admin/orders", label: "الطلبات", Icon: ClipboardList, keywords: "orders" },
  { to: "/admin/settings", label: "الإعدادات", Icon: Settings, keywords: "settings delivery cutoff التوصيل القفل" },
];
