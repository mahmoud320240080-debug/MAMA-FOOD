import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardList, Receipt, Wallet } from "lucide-react";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import { EmptyState, PageError } from "@/components/admin/PageState";
import { OrdersPerDayChart, RevenuePerDayChart, TopMealsChart } from "@/components/admin/DashboardCharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ORDER_STATUS } from "@/lib/constants";
import { formatDayLabel } from "@/lib/dates";
import { formatPrice } from "@/lib/format";

const card = "rounded-3xl bg-white p-4 text-ink shadow-soft md:p-5";

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className={card}>
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-red/10 text-brand-red">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-0.5 break-words text-xl font-extrabold tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

/** كارت شارت + جدول مخفي بنفس الأرقام لقارئ الشاشة */
function ChartCard({ title, subtitle, table, children }) {
  return (
    <section className={card}>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-4" aria-hidden="true">{children}</div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {table.map(([k, v]) => <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>)}
        </tbody>
      </table>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading, isError, error, refetch } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">نظرة عامة</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {stats
            ? `أرقام الأسبوع ده: من ${formatDayLabel(stats.weekStart)} لـ ${formatDayLabel(stats.weekEnd)}. الطلبات الملغية مش محسوبة، والإيرادات من غير التوصيل.`
            : "أرقام الأسبوع ده (من الأحد للسبت). الطلبات الملغية مش محسوبة، والإيرادات من غير التوصيل."}
        </p>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <PageError title="تعذر تحميل الإحصائيات" error={error} onRetry={refetch} />
      ) : stats.weekOrdersCount === 0 ? (
        <EmptyState
          animation="noOrders"
          title="لسه مفيش طلبات الأسبوع ده"
          description="أول ما الزباين يطلبوا، الأرقام والرسوم البيانية هتظهر هنا."
          action={<Button as={Link} to="/admin/menu" variant="outline">راجع المنيو الأسبوعي</Button>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="طلبات الأسبوع"
              value={stats.totalOrders}
              hint={stats.statusCounts.cancelled > 0 ? `+ ${stats.statusCounts.cancelled} ملغي` : null}
            />
            <StatCard icon={CalendarCheck} label="طلبات جديدة النهارده" value={stats.todayOrders} />
            <StatCard icon={Wallet} label="إيرادات الأسبوع" value={formatPrice(stats.revenue)} hint="تمن الأكل من غير التوصيل" />
            <StatCard icon={Receipt} label="متوسط الطلب" value={formatPrice(stats.averageOrderValue)} hint="من غير التوصيل" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard
              title="الطلبات كل يوم"
              subtitle="حسب يوم ما الطلب اتعمل"
              table={stats.days.map((d) => [formatDayLabel(d.date), `${d.orders} طلب`])}
            >
              <OrdersPerDayChart days={stats.days} />
            </ChartCard>

            <ChartCard
              title="الإيرادات كل يوم"
              subtitle="تمن الأكل من غير التوصيل"
              table={stats.days.map((d) => [formatDayLabel(d.date), formatPrice(d.revenue)])}
            >
              <RevenuePerDayChart days={stats.days} />
            </ChartCard>

            <ChartCard
              title="الأكتر مبيعاً"
              subtitle="أعلى 5 وجبات بالكمية"
              table={stats.topMeals.map((m) => [m.name, `${m.quantity} وجبة`])}
            >
              {stats.topMeals.length ? (
                <TopMealsChart meals={stats.topMeals} />
              ) : (
                <p className="py-10 text-center text-sm text-ink-soft">مفيش مبيعات لسه (كل طلبات الأسبوع ملغية)</p>
              )}
            </ChartCard>

            <section className={card}>
              <h2 className="text-lg font-extrabold">حالات الطلبات</h2>
              <p className="text-sm text-ink-soft">كل طلبات الأسبوع، والملغي معاهم</p>
              <ul className="mt-4 space-y-2">
                {Object.keys(ORDER_STATUS).map((status) => (
                  <li key={status} className="flex min-h-[44px] items-center justify-between gap-3 rounded-2xl bg-cream px-4">
                    <OrderStatusBadge status={status} />
                    <span className="text-lg font-extrabold tabular-nums">{stats.statusCounts[status]}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
