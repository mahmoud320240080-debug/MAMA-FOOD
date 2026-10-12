import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { List, LayoutGrid } from "lucide-react";
import { ordersApi, orderDates } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import Modal from "@/components/common/Modal";
import ResponsiveTable from "@/components/common/ResponsiveTable";
import FilterBar from "@/components/admin/FilterBar";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PrepSummary from "@/components/admin/PrepSummary";
import OrdersKanban from "@/components/admin/OrdersKanban";
import { EmptyState, PageError } from "@/components/admin/PageState";
import { PaymentChip } from "@/components/common/PaymentBadges";
import { ORDER_STATUS } from "@/lib/constants";
import { formatDayLabel } from "@/lib/dates";
import { ORDER_CREATED, ORDER_SORTS, filterOrders, orderAreaOptions } from "@/lib/filters";
import { formatDateTime, formatPrice } from "@/lib/format";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

/** اسم كل فلتر في الـ URL (عشان الريفريش واللينك المتشارك يحافظوا عليه) */
const PARAM_KEYS = { q: "q", status: "status", date: "date", payment: "pay", area: "area", created: "created", sort: "sort" };
const DEFAULT_SORT = "newest";

/** فلتر الدفع: كاش أو تحويل (الإيصال بيترفع مع الطلب فبيبقى "وصل الإيصال" دايماً) */
const PAYMENT_FILTERS = [
  { value: "cash", label: "كاش" },
  { value: "confirmed", label: "وصل الإيصال" },
];

const TABS = [
  { key: "list", label: "كل الطلبات" },
  { key: "prep", label: "التحضير" },
];

function DayPills({ order }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {orderDates(order).map((d) => (
        <span key={d} className="whitespace-nowrap rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink">
          {formatDayLabel(d)}
        </span>
      ))}
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-12 w-full max-w-sm" />
      <Skeleton className="h-11 w-full" />
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl md:h-16" />)}
    </div>
  );
}

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  const tab = params.get("tab") === "prep" ? "prep" : "list";
  const q = params.get("q") || "";
  const status = params.get("status") || "";
  const date = params.get("date") || "";
  // قيمة قديمة أو غلط في لينك محفوظ => من غير فلتر
  const payment = PAYMENT_FILTERS.some((f) => f.value === params.get("pay")) ? params.get("pay") : "";
  const created = ORDER_CREATED[params.get("created")] ? params.get("created") : "";
  const sort = ORDER_SORTS[params.get("sort")] ? params.get("sort") : DEFAULT_SORT;

  // طريقة العرض: قائمة أو كانبان مع الحفظ في localStorage
  const [view, setView] = useState(() => {
    try {
      const raw = localStorage.getItem("mamafood:admin:ordersView");
      if (!raw) return "list";
      try {
        return JSON.parse(raw) || "list";
      } catch {
        return raw;
      }
    } catch {
      return "list";
    }
  });

  const handleViewChange = (newView) => {
    setView(newView);
    try {
      localStorage.setItem("mamafood:admin:ordersView", JSON.stringify(newView));
    } catch { /* التخزين مقفول (وضع خاص): التفضيل مش هيتحفظ وده عادي */ }
  };

  // حالة التحديد الجماعي
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatusPickerOpen, setBulkStatusPickerOpen] = useState(false);
  const [bulkConfirmModal, setBulkConfirmModal] = useState({ open: false, targetStatus: "" });

  // الفلاتر في الـ URL عشان الريفريش والرجوع من صفحة التفاصيل يحافظوا عليها
  const setParam = (key, value) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });

  const clearFilters = () => setParams(tab === "prep" ? { tab } : {}, { replace: true });

  // تغيير فلتر أو أكتر مرة واحدة (الـ BottomSheet بيطبّق كذا فلتر في نفس اللحظة)
  const updateFilters = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value && !(key === "sort" && value === DEFAULT_SORT)) next.set(PARAM_KEYS[key], value);
        else next.delete(PARAM_KEYS[key]);
      }
      return next;
    }, { replace: true });

  const { data: orders = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  // المناطق اللي ظاهرة في الطلبات (ومنطقة مش موجودة في لينك قديم => من غير فلتر)
  const areaOptions = useMemo(() => orderAreaOptions(orders), [orders]);
  const area = areaOptions.some((o) => o.value === params.get("area")) ? params.get("area") : "";

  // نفس الفلاتر للقايمة والكانبان
  const filters = useMemo(() => ({ q, status, date, payment, area, created, sort }), [q, status, date, payment, area, created, sort]);
  const filtered = useMemo(() => filterOrders(orders, filters), [orders, filters]);

  // مسح التحديد عند تغيير الفلاتر أو الترتيب أو طريقة العرض
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters, view]);

  // طفرة التحديث الجماعي
  const bulkMutation = useMutation({
    mutationFn: ({ ids, status: targetStatus }) => ordersApi.bulkUpdateStatus(ids, targetStatus),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (result.updatedCount === 0 && result.skippedCount > 0) {
        toast.error(`تعذر تغيير حالة الطلبات المحددة (الحالة غير متاحة للانتقال لـ ${result.skippedCount} طلب)`);
      } else if (result.skippedCount > 0) {
        toast.success(`تم تغيير حالة ${result.updatedCount} طلب (تم تخطي ${result.skippedCount} طلب لعدم إمكانية تغيير حالتهم)`);
        setSelectedIds(new Set());
      } else {
        toast.success(`تم تغيير حالة ${result.updatedCount} طلب بنجاح`);
        setSelectedIds(new Set());
      }
      setBulkConfirmModal({ open: false, targetStatus: "" });
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء تحديث الطلبات");
    },
  });

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((o) => o.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // الفلاتر وعدد كل اختيار (مع باقي الفلاتر)
  const filterConfig = useMemo(() => {
    const without = (key) => filterOrders(orders, { ...filters, [key]: "" });
    const byStatus = without("status");
    const byDay = without("date");
    const byPayment = without("payment");
    const byArea = without("area");
    const byCreated = without("created");
    const dates = new Set(orders.flatMap(orderDates));
    if (date) dates.add(date);
    return [
      {
        key: "status", label: "الحالة",
        options: [
          { value: "", label: "كل الحالات", count: byStatus.length },
          ...Object.entries(ORDER_STATUS).map(([value, s]) => ({ value, label: s.label, count: byStatus.filter((o) => o.status === value).length })),
        ],
      },
      {
        key: "date", label: "اليوم المطلوب",
        options: [
          { value: "", label: "كل الأيام" },
          ...[...dates].sort().map((d) => ({ value: d, label: formatDayLabel(d), count: byDay.filter((o) => o.items.some((it) => it.date === d)).length })),
        ],
      },
      {
        key: "payment", label: "الدفع",
        options: [
          { value: "", label: "كل طرق الدفع", count: byPayment.length },
          ...PAYMENT_FILTERS.map((f) => ({ ...f, count: filterOrders(byPayment, { payment: f.value }).length })),
        ],
      },
      {
        key: "area", label: "المنطقة",
        options: [
          { value: "", label: "كل المناطق", count: byArea.length },
          ...areaOptions.map((o) => ({ ...o, count: filterOrders(byArea, { area: o.value }).length })),
        ],
      },
      {
        key: "created", label: "تاريخ الطلب",
        options: [
          { value: "", label: "كل التواريخ", count: byCreated.length },
          ...Object.entries(ORDER_CREATED).map(([value, label]) => ({ value, label, count: filterOrders(byCreated, { created: value }).length })),
        ],
      },
      {
        key: "sort", label: "الترتيب", defaultValue: DEFAULT_SORT, counted: false,
        options: Object.entries(ORDER_SORTS).map(([value, label]) => ({ value, label })),
      },
    ];
  }, [orders, filters, date, areaOptions]);

  const openOrder = (o) => navigate(`/admin/orders/${o.id}`, { state: { from: location.search } });

  // أعمدة الجدول
  const columns = [
    {
      key: "select",
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            aria-label="تحديد كل الطلبات المعروضة"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={toggleSelectAll}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 cursor-pointer rounded border-ink/20 text-brand-red focus:ring-brand-red"
          />
        </div>
      ),
      headerClassName: "w-12 px-3 text-center",
      className: "w-12 px-3 text-center",
      render: (o) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            aria-label={`تحديد طلب #${o.orderNumber}`}
            checked={selectedIds.has(o.id)}
            onChange={() => toggleSelectOne(o.id)}
            className="h-5 w-5 cursor-pointer rounded border-ink/20 text-brand-red focus:ring-brand-red"
          />
        </div>
      ),
    },
    {
      key: "order",
      header: "الطلب",
      render: (o) => (
        <>
          <span className="block whitespace-nowrap font-black">#{o.orderNumber}</span>
          <span className="block min-w-[4.5rem] text-xs text-ink-soft">{formatDateTime(o.createdAt)}</span>
        </>
      ),
    },
    {
      key: "customer",
      header: "العميل",
      render: (o) => (
        <>
          <span className="block max-w-[12rem] truncate font-bold" title={o.customer.name}>{o.customer.name}</span>
          <span dir="ltr" className="block text-end text-sm text-ink-soft">{o.customer.phone}</span>
          <div className="mt-1.5 max-w-[12rem] xl:hidden"><DayPills order={o} /></div>
        </>
      ),
    },
    { key: "days", header: "الأيام المطلوبة", className: "hidden xl:table-cell", headerClassName: "hidden xl:table-cell", render: (o) => <DayPills order={o} /> },
    {
      key: "total",
      header: "الإجمالي",
      className: "font-extrabold text-brand-red [overflow-wrap:anywhere]",
      render: (o) => (
        <>
          <span className="block">{formatPrice(o.totalPrice)}</span>
          <PaymentChip order={o} className="mt-1" />
        </>
      ),
    },
    { key: "status", header: "الحالة", className: "w-px", render: (o) => <OrderStatusSelect order={o} className="min-w-[9rem]" /> },
  ];

  return (
    <div className="space-y-3.5">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">الطلبات</h1>
        <p className="mt-1 hidden text-sm text-ink-soft sm:block">تابع الطلبات وغيّر حالتها، وشوف المطلوب تحضيره لكل يوم.</p>
      </div>

      {/* التابات الرئيسية (كل الطلبات / التحضير) + مفتاح التبديل (قائمة / كانبان) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div role="tablist" aria-label="عرض الطلبات" className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 shadow-soft sm:inline-grid sm:w-72">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setParam("tab", t.key === "prep" ? "prep" : "")}
              className={cn(
                "min-h-[44px] rounded-full px-3 text-xs sm:text-sm font-bold transition",
                tab === t.key ? "bg-brand-red text-white" : "text-ink hover:bg-ink/5"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "list" && (
          <div aria-label="طريقة عرض الطلبات" className="inline-flex rounded-full bg-white p-1 shadow-soft">
            <button
              type="button"
              onClick={() => handleViewChange("list")}
              aria-pressed={view === "list"}
              className={cn(
                "flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs sm:text-sm font-bold transition",
                view === "list" ? "bg-brand-red text-white shadow-sm" : "text-ink hover:bg-ink/5"
              )}
            >
              <List className="h-4 w-4" aria-hidden />
              <span>قائمة</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("kanban")}
              aria-pressed={view === "kanban"}
              className={cn(
                "flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-xs sm:text-sm font-bold transition",
                view === "kanban" ? "bg-brand-red text-white shadow-sm" : "text-ink hover:bg-ink/5"
              )}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              <span>كانبان</span>
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <OrdersSkeleton />
      ) : isError ? (
        <PageError title="تعذر تحميل الطلبات" error={error} onRetry={refetch} />
      ) : tab === "prep" ? (
        <PrepSummary orders={orders} day={params.get("day") || ""} onDayChange={(d) => setParam("day", d)} />
      ) : orders.length === 0 ? (
        <EmptyState
          animation="noOrders"
          title="لسه مفيش طلبات"
          description="الطلبات اللي الزباين بيأكدوها من صفحة الطلب هتظهر هنا على طول."
        />
      ) : (
        <div className="space-y-4">
          {/* البحث والفلاتر (نفسها للقايمة والكانبان) */}
          <FilterBar
            search={{ value: q, onChange: (v) => updateFilters({ q: v }), label: "بحث في الطلبات", placeholder: "رقم الطلب، الاسم، الموبايل أو المنطقة" }}
            filters={filterConfig}
            values={filters}
            onChange={updateFilters}
            resultLabel={`${filtered.length} طلب`}
            onClearAll={clearFilters}
          />

          {filtered.length === 0 ? (
            <EmptyState
              animation="noResults"
              title="مفيش نتايج"
              description="جرّب كلمة بحث تانية أو غيّر الفلاتر."
              action={<Button variant="outline" onClick={clearFilters}>مسح الفلاتر</Button>}
            />
          ) : view === "kanban" ? (
            /* ── عرض الكانبان ── */
            <OrdersKanban orders={filtered} />
          ) : (
            /* ── عرض القائمة مع الإجراءات الجماعية ── */
            <div className="space-y-4">
              {/* شريط الإجراءات الجماعية على الديسكتوب (أعلى الجدول) */}
              {selectedIds.size > 0 && (
                <div className="hidden items-center justify-between gap-4 rounded-3xl bg-ink p-4 text-white shadow-soft md:flex">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-yellow px-1.5 text-xs font-bold text-ink">
                      {selectedIds.size}
                    </span>
                    <span className="text-sm font-bold">تم تحديد {selectedIds.size} طلب</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setBulkStatusPickerOpen(true)}
                      className="min-h-[44px]"
                    >
                      تغيير الحالة
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds(new Set())}
                      className="min-h-[44px] text-white hover:bg-white/10"
                    >
                      إلغاء التحديد
                    </Button>
                  </div>
                </div>
              )}

              <ResponsiveTable
                columns={columns}
                rows={filtered}
                onRowClick={openOrder}
                renderCard={(o) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`تحديد طلب #${o.orderNumber}`}
                            checked={selectedIds.has(o.id)}
                            onChange={() => toggleSelectOne(o.id)}
                            className="h-5 w-5 cursor-pointer rounded border-ink/20 text-brand-red focus:ring-brand-red"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-black">#{o.orderNumber}</p>
                          <p className="text-xs text-ink-soft">{formatDateTime(o.createdAt)}</p>
                        </div>
                      </div>
                      <p className="min-w-0 text-end text-lg font-extrabold text-brand-red [overflow-wrap:anywhere]">{formatPrice(o.totalPrice)}</p>
                    </div>
                    <div className="mt-2 min-w-0">
                      <p className="truncate font-bold">{o.customer.name}</p>
                      <p dir="ltr" className="text-end text-sm text-ink-soft">{o.customer.phone}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <PaymentChip order={o} />
                      <DayPills order={o} />
                    </div>
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      <OrderStatusSelect order={o} className="w-full" />
                    </div>
                  </>
                )}
              />

              {/* مسافة تحت آخر كارت بارتفاع الشريط العايم => آخر طلب ما يستخباش وراه */}
              {selectedIds.size > 0 && <div aria-hidden="true" className="h-[calc(6rem+var(--safe-bottom))] md:hidden" />}

              {/* شريط الإجراءات الجماعية على الموبايل (عائم في الأسفل مع مراعاة Safe Area) */}
              {selectedIds.size > 0 && (
                <div className="fixed inset-x-4 bottom-4 z-40 pb-safe md:hidden">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-3.5 text-white shadow-pop">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-yellow px-1.5 text-xs font-bold text-ink">
                        {selectedIds.size}
                      </span>
                      <span className="text-xs font-bold">محدد {selectedIds.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setBulkStatusPickerOpen(true)}
                        className="min-h-[44px] text-xs"
                      >
                        تغيير الحالة
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                        className="min-h-[44px] text-xs text-white hover:bg-white/10"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* مودال اختيار الحالة لتطبيقها جماعياً */}
      <Modal
        open={bulkStatusPickerOpen}
        onClose={() => setBulkStatusPickerOpen(false)}
        title="اختر الحالة الجديدة"
        size="sm"
      >
        <div className="space-y-2.5 py-2">
          {Object.entries(ORDER_STATUS).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setBulkStatusPickerOpen(false);
                setBulkConfirmModal({ open: true, targetStatus: key });
              }}
              className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-ink/10 bg-white px-4 py-3 font-bold transition hover:border-brand-red/40 hover:bg-cream active:scale-98"
            >
              <span>{config.label}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", config.badge)}>
                {config.label}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* مودال تأكيد التغيير الجماعي */}
      <Modal
        open={bulkConfirmModal.open}
        onClose={() => setBulkConfirmModal({ open: false, targetStatus: "" })}
        title="تأكيد تغيير حالة الطلبات"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 min-[400px]:flex-row min-[400px]:gap-3">
            <Button
              variant="ghost"
              block
              onClick={() => setBulkConfirmModal({ open: false, targetStatus: "" })}
              disabled={bulkMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              block
              loading={bulkMutation.isPending}
              onClick={() =>
                bulkMutation.mutate({
                  ids: Array.from(selectedIds),
                  status: bulkConfirmModal.targetStatus,
                })
              }
            >
              نعم، تغيير الحالة
            </Button>
          </div>
        }
      >
        <p className="text-sm font-semibold leading-relaxed text-ink">
          متأكد إنك عايز تغيّر حالة <strong className="text-brand-red">{selectedIds.size}</strong> طلب إلى{" "}
          <strong className="text-brand-red">{ORDER_STATUS[bulkConfirmModal.targetStatus]?.label}</strong>؟
        </p>
      </Modal>
    </div>
  );
}
