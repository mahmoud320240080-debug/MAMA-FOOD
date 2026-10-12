import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, ShoppingBag } from "lucide-react";
import { ordersApi, orderDates } from "@/api";
import { ORDER_STATUS, canChangeOrderStatus, nextOrderStatuses } from "@/lib/constants";
import { formatDayLabel } from "@/lib/dates";
import { formatPrice, formatTimeAgo } from "@/lib/format";
import { toast } from "@/store/useToastStore";
import BottomSheet from "@/components/common/BottomSheet";
import { PaymentChip } from "@/components/common/PaymentBadges";
import Button from "@/components/common/Button";
import { cn } from "@/lib/cn";

const KANBAN_STATUSES = ["new", "preparing", "delivering", "done", "cancelled"];

function DayPills({ order }) {
  const dates = orderDates(order);
  if (!dates.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {dates.map((d) => (
        <span
          key={d}
          className="whitespace-nowrap rounded-md bg-cream-dark px-2 py-0.5 text-[11px] font-semibold text-ink"
        >
          {formatDayLabel(d)}
        </span>
      ))}
    </div>
  );
}

// كارت الطلب المعروض داخل العمود
function KanbanOrderCard({ order, isDragging = false, onClick, onOpenStatusSheet }) {
  const totalItems = order.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0;
  const timeAgo = formatTimeAgo(order.createdAt);
  const validTransitions = nextOrderStatuses(order.status);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "group relative flex flex-col gap-2 rounded-2xl border border-ink/10 bg-white p-3.5 shadow-sm transition",
        "hover:border-brand-red/30 hover:shadow-soft active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red",
        isDragging && "opacity-40"
      )}
    >
      {/* هيدر الكارت: رقم الطلب + التوقيت النسبي */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-ink text-base">#{order.orderNumber}</span>
        {timeAgo && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-soft">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            <span>{timeAgo}</span>
          </span>
        )}
      </div>

      {/* اسم العميل والموبايل */}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-ink" title={order.customer?.name}>
          {order.customer?.name}
        </p>
      </div>

      {/* الدفع + الأيام المطلوبة */}
      <div className="flex flex-wrap items-center gap-1">
        <PaymentChip order={order} />
      </div>
      <DayPills order={order} />

      {/* الفوتر: عدد الأصناف + السعر الإجمالي */}
      <div className="mt-1 flex items-center justify-between gap-2 border-t border-ink/5 pt-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-ink-soft">
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{totalItems} أصناف</span>
        </span>
        <span className="font-extrabold text-brand-red text-sm">
          {formatPrice(order.totalPrice)}
        </span>
      </div>

      {/* زر تغيير الحالة للموبايل */}
      {onOpenStatusSheet && validTransitions.length > 0 && (
        <div className="mt-1 md:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenStatusSheet(order);
            }}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink transition hover:bg-ink/10 active:scale-95"
          >
            تغيير الحالة
          </button>
        </div>
      )}
    </div>
  );
}

// عنصر كارت الطلب القابل للسحب (على الديسكتوب/التابلت)
function DraggableKanbanCard({ order, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
    >
      <KanbanOrderCard
        order={order}
        isDragging={isDragging}
        onClick={onClick}
      />
    </div>
  );
}

// عمود الحالة القابل للإفلات فيه
function KanbanColumn({ statusKey, orders, activeOrder, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusKey,
  });

  const statusConfig = ORDER_STATUS[statusKey] || { label: statusKey, badge: "" };
  const isValidTarget = activeOrder && canChangeOrderStatus(activeOrder.status, statusKey);
  const isInvalidTarget = activeOrder && activeOrder.status !== statusKey && !isValidTarget;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 min-w-[270px] max-w-[300px] shrink-0 flex-col rounded-3xl border-2 bg-white/70 p-3.5 shadow-soft transition-colors",
        isOver && isValidTarget && "border-brand-red bg-brand-red/5 ring-2 ring-brand-red/20",
        isOver && isInvalidTarget && "border-brand-red/40 bg-ink/5",
        !isOver && isValidTarget && "border-brand-yellow-dark/60 bg-cream/50",
        !isOver && isInvalidTarget && "opacity-75 border-ink/10 bg-white/50",
        !activeOrder && "border-ink/10 hover:border-brand-red/30"
      )}
    >
      {/* هيدر العمود */}
      <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-3 w-3 rounded-full",
              statusConfig.tone === "red" && "bg-brand-red",
              statusConfig.tone === "yellow" && "bg-brand-yellow",
              statusConfig.tone === "blue" && "bg-blue-500",
              statusConfig.tone === "green" && "bg-green-500",
              statusConfig.tone === "gray" && "bg-ink-soft"
            )}
            aria-hidden
          />
          <h3 className="font-extrabold text-ink text-base">
            {statusConfig.label}
          </h3>
        </div>
        <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-yellow px-1.5 text-xs font-bold text-ink">
          {orders.length}
        </span>
      </div>

      {/* قائمة كروت العمود مع سكرول داخلي */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[160px] p-0.5 scrollbar-thin">
        {orders.length === 0 ? (
          <div className="grid h-full min-h-[140px] place-items-center rounded-2xl border border-dashed border-ink/15 p-4 text-center">
            <p className="text-xs font-semibold text-ink-soft">
              لا توجد طلبات في هذه الحالة
            </p>
          </div>
        ) : (
          orders.map((o) => (
            <DraggableKanbanCard
              key={o.id}
              order={o}
              onClick={() => onCardClick(o)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function OrdersKanban({ orders = [] }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // حالة السحب الجاري
  const [activeOrder, setActiveOrder] = useState(null);

  // حالة التاب للموبايل
  const [mobileStatusTab, setMobileStatusTab] = useState("new");

  // شيت تغيير الحالة على الموبايل
  const [statusSheetOrder, setStatusSheetOrder] = useState(null);

  // سينسورات dnd-kit مع تفعيل آمن للمس والماوس
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // كليك عادي يفتح الطلب ولا يعتبر سحب
      },
    }),
    useSensor(KeyboardSensor)
  );

  // طفرة تحديث الحالة مع تحديث تفاؤلي وتراجع فوري عند الفشل
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => ordersApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousOrders = queryClient.getQueryData(["orders"]);

      queryClient.setQueryData(["orders"], (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) => (o.id === id ? { ...o, status } : o));
      });

      return { previousOrders };
    },
    onError: (err, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }
      toast.error(err.message || "تعذر تغيير حالة الطلب");
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["order", updated.id], updated);
      toast.success(`طلب #${updated.orderNumber}: ${ORDER_STATUS[updated.status]?.label}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const ordersByStatus = useMemo(() => {
    const map = {
      new: [],
      preparing: [],
      delivering: [],
      done: [],
      cancelled: [],
    };
    for (const o of orders) {
      if (map[o.status]) {
        map[o.status].push(o);
      }
    }
    return map;
  }, [orders]);

  const handleDragStart = (event) => {
    const order = event.active.data.current?.order;
    if (order) setActiveOrder(order);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;
    const orderId = active.id;
    const targetStatus = over.id;
    const currentOrder = orders.find((o) => o.id === orderId);

    if (!currentOrder || currentOrder.status === targetStatus) return;

    // تنفيذ التغيير (الـ API سترمي خطأ لو الانتقال غير مسموح والـ mutation سيتراجع فورياً)
    updateStatusMutation.mutate({ id: orderId, status: targetStatus });
  };

  const openOrder = (o) => {
    navigate(`/admin/orders/${o.id}`, { state: { from: location.search } });
  };

  const mobileOrders = ordersByStatus[mobileStatusTab] || [];
  const sheetValidStatuses = statusSheetOrder ? nextOrderStatuses(statusSheetOrder.status) : [];

  return (
    <div className="space-y-4">
      {/* ── شاشات الموبايل (< md): تابات للحالات بدون سحب وإفلات ── */}
      <div className="space-y-4 md:hidden">
        {/* شريط تابات الحالات */}
        <div
          role="tablist"
          aria-label="حالات الطلبات"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none"
        >
          {KANBAN_STATUSES.map((st) => {
            const count = (ordersByStatus[st] || []).length;
            const isActive = mobileStatusTab === st;
            const config = ORDER_STATUS[st];
            return (
              <button
                key={st}
                type="button"
                role="tab"
                id={`status-tab-${st}`}
                aria-selected={isActive}
                aria-controls={`status-panel-${st}`}
                onClick={() => setMobileStatusTab(st)}
                className={cn(
                  "flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition active:scale-95",
                  isActive
                    ? "bg-brand-red text-white shadow-soft"
                    : "border border-ink/10 bg-white text-ink hover:bg-cream"
                )}
              >
                <span>{config?.label || st}</span>
                <span
                  className={cn(
                    "grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-xs font-bold",
                    isActive ? "bg-brand-yellow text-ink" : "bg-ink/10 text-ink"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* قائمة الكروت للحالة المختارة */}
        <div
          id={`status-panel-${mobileStatusTab}`}
          role="tabpanel"
          aria-labelledby={`status-tab-${mobileStatusTab}`}
          className="space-y-3"
        >
          {mobileOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-8 text-center text-sm font-semibold text-ink-soft">
              لا توجد طلبات في هذه الحالة
            </div>
          ) : (
            mobileOrders.map((o) => (
              <KanbanOrderCard
                key={o.id}
                order={o}
                onClick={() => openOrder(o)}
                onOpenStatusSheet={setStatusSheetOrder}
              />
            ))
          )}
        </div>
      </div>

      {/* ── شاشات التابلت والديسكتوب (>= md): لوحة الكانبان بأعمدة وسحب وإفلات ── */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6 scrollbar-thin md:mx-0 md:px-0">
            {KANBAN_STATUSES.map((st) => (
              <KanbanColumn
                key={st}
                statusKey={st}
                orders={ordersByStatus[st] || []}
                activeOrder={activeOrder}
                onCardClick={openOrder}
              />
            ))}
          </div>

          <DragOverlay>
            {activeOrder ? (
              <div className="w-72 shadow-pop rotate-1">
                <KanbanOrderCard order={activeOrder} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* شيت تغيير الحالة على الموبايل */}
      <BottomSheet
        open={!!statusSheetOrder}
        onClose={() => setStatusSheetOrder(null)}
        title={statusSheetOrder ? `تغيير حالة طلب #${statusSheetOrder.orderNumber}` : "تغيير الحالة"}
      >
        <div className="space-y-3 py-2">
          {sheetValidStatuses.length === 0 ? (
            <p className="text-center text-sm font-semibold text-ink-soft">
              هذا الطلب في حالة نهائية ولا يمكن تغيير حالته.
            </p>
          ) : (
            sheetValidStatuses.map((st) => {
              const config = ORDER_STATUS[st];
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    const id = statusSheetOrder.id;
                    setStatusSheetOrder(null);
                    updateStatusMutation.mutate({ id, status: st });
                  }}
                  className={cn(
                    "flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-ink/10 px-4 py-3 font-bold transition active:scale-98",
                    st === "cancelled"
                      ? "bg-ink/5 text-ink hover:bg-ink/10"
                      : "bg-white text-ink hover:bg-brand-red/10 hover:text-brand-red"
                  )}
                >
                  <span>{st === "cancelled" ? "إلغاء الطلب" : config?.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-bold",
                      config?.badge
                    )}
                  >
                    {config?.label}
                  </span>
                </button>
              );
            })
          )}
          <Button
            variant="ghost"
            block
            onClick={() => setStatusSheetOrder(null)}
            className="mt-2"
          >
            إلغاء
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
