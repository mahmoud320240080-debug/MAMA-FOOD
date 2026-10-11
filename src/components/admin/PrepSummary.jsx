import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/api";
import Skeleton from "@/components/common/Skeleton";
import Reveal from "@/components/common/Reveal";
import FilterChips from "./FilterChips";
import { EmptyState, PageError } from "./PageState";
import { formatDayLabel, getUpcomingDates, toDateKey } from "@/lib/dates";
import { cn } from "@/lib/cn";

function TotalsCard({ title, rows, tone, emptyText, index = 0 }) {
  return (
    <Reveal as="section" index={index} className="rounded-3xl bg-white p-5 text-ink shadow-soft">
      <h3 className="mb-3 text-lg font-extrabold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-ink/5">
          {rows.map((r) => (
            <li key={r.id} className="flex min-h-[48px] items-center gap-3 py-2">
              <span
                className={cn(
                  "grid h-10 min-w-[2.75rem] shrink-0 place-items-center rounded-2xl px-2 text-lg font-black",
                  tone === "red" ? "bg-brand-red text-white" : "bg-brand-yellow text-ink"
                )}
              >
                {r.quantity}
              </span>
              <span className="min-w-0 flex-1 font-bold [overflow-wrap:anywhere]">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </Reveal>
  );
}

/**
 * "تحضير يوم X": إجمالي كل وجبة وكل إضافة مطلوبة لليوم (من غير الطلبات الملغية).
 * orders: كل الطلبات (عشان نعرض الأيام اللي فيها طلبات).
 */
export default function PrepSummary({ orders, day, onDayChange }) {
  const today = toDateKey(new Date());

  // الأيام: النهارده + الـ 7 أيام الجاية + أي يوم عليه طلبات
  const { dayOptions, defaultDay } = useMemo(() => {
    const counts = new Map();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const d of new Set(o.items.map((it) => it.date))) counts.set(d, (counts.get(d) || 0) + 1);
    }
    const dates = new Set([today, ...getUpcomingDates().map((d) => d.date), ...counts.keys()]);
    const sorted = [...dates].sort();
    const firstWithOrders = sorted.find((d) => d >= today && counts.get(d));
    return {
      dayOptions: sorted.map((d) => ({
        value: d,
        label: d === today ? `النهارده · ${formatDayLabel(d)}` : formatDayLabel(d),
        count: counts.get(d) || 0,
      })),
      defaultDay: firstWithOrders || getUpcomingDates(1)[0].date,
    };
  }, [orders, today]);

  const selected = day || defaultDay;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", "prep", selected],
    queryFn: () => ordersApi.prepSummary(selected),
    staleTime: 0,
  });

  return (
    <div className="space-y-5">
      <FilterChips label="اختار يوم التحضير" options={dayOptions} value={selected} onChange={onDayChange} />

      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-extrabold md:text-2xl">تحضير يوم {formatDayLabel(selected)}</h2>
        {data && (
          <p className="text-sm font-bold text-ink-soft">
            {data.ordersCount} طلب · {data.mealsCount} وجبة
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-56 rounded-3xl" />
        </div>
      ) : isError ? (
        <PageError title="تعذر تحميل ملخص التحضير" error={error} onRetry={refetch} />
      ) : data.ordersCount === 0 ? (
        <EmptyState animation="noOrders" title="مفيش طلبات لليوم ده" description="أول ما الطلبات توصل هتلاقي إجمالي الوجبات والإضافات هنا." />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <TotalsCard title="الوجبات" rows={data.meals} tone="red" emptyText="مفيش وجبات" />
            <TotalsCard index={1} title="الإضافات" rows={data.addons} tone="yellow" emptyText="مفيش إضافات مطلوبة لليوم ده" />
          </div>
          <p className="text-xs text-ink-soft">الطلبات الملغية مش محسوبة في الإجماليات.</p>
        </>
      )}
    </div>
  );
}
