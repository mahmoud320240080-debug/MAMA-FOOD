import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate } from "./mockDb";
import { calcOrderTotal } from "./orders";
import { ORDER_STATUS } from "@/lib/constants";
import { getCurrentWeek, toDateKey } from "@/lib/dates";

/**
 * إحصائيات لوحة التحكم (نفس منطق GET /admin/dashboard على الباك):
 * - "الأسبوع ده" = من الأحد للسبت اللي فيه النهارده (getCurrentWeek)، بتوقيت الجهاز.
 * - الطلب بيتحسب في اليوم اللي اتعمل فيه (createdAt)، مش أيام التوصيل اللي جواه.
 * - الطلبات الملغية مش داخلة في عدد الطلبات ولا الإيرادات ولا الأكتر مبيعاً؛ بتظهر بس في توزيع الحالات.
 * - الإيرادات = تمن الأكل بس (foodRevenue)، من غير رسوم التوصيل أبداً، حتى لو الأدمن غيّرها في الإعدادات.
 */

/**
 * إيراد طلب واحد = subtotal (الوجبات + الإضافات المدفوعة × الكمية).
 * طلب قديم من غير subtotal سليم => بنحسبه من الوجبات بنفس حساب إنشاء الطلب (calcOrderTotal).
 * عمرنا ما بنستخدم totalPrice ولا deliveryFee هنا.
 */
const foodRevenue = (o) =>
  Number.isFinite(o.subtotal) && o.subtotal >= 0 ? o.subtotal : calcOrderTotal(o.items).subtotal;
export const buildDashboardStats = (orders, now = new Date()) => {
  const week = getCurrentWeek(now);
  const todayKey = toDateKey(now);
  const days = new Map(week.map((d) => [d.date, { date: d.date, dayName: d.dayName, orders: 0, revenue: 0 }]));
  const createdDay = (o) => toDateKey(new Date(o.createdAt));

  const weekOrders = orders.filter((o) => days.has(createdDay(o)));
  const statusCounts = Object.fromEntries(Object.keys(ORDER_STATUS).map((s) => [s, 0]));
  const meals = new Map();
  let revenue = 0;
  let todayOrders = 0;
  let totalOrders = 0;

  for (const o of weekOrders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    if (o.status === "cancelled") continue;
    const day = days.get(createdDay(o));
    const orderRevenue = foodRevenue(o);
    day.orders++;
    day.revenue += orderRevenue;
    revenue += orderRevenue;
    totalOrders++;
    if (day.date === todayKey) todayOrders++;
    for (const it of o.items) {
      const row = meals.get(it.mealId) || { id: it.mealId, name: it.name, quantity: 0 };
      row.quantity += it.quantity;
      meals.set(it.mealId, row);
    }
  }

  return {
    weekStart: week[0].date,
    weekEnd: week[6].date,
    weekOrdersCount: weekOrders.length, // كل الطلبات حتى الملغية (للحالة الفاضية)
    totalOrders,
    todayOrders,
    revenue,
    averageOrderValue: totalOrders ? Math.round(revenue / totalOrders) : 0,
    days: [...days.values()],
    topMeals: [...meals.values()]
      .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "ar"))
      .slice(0, 5),
    statusCounts,
  };
};

export const dashboardApi = {
  getStats: () =>
    USE_MOCK
      ? simulate(() => buildDashboardStats(db.read("orders", [])))
      : http("/admin/dashboard"),
};
