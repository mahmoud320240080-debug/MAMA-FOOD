import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { m } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { ordersApi } from "@/api";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import OrderStatusBadge from "./OrderStatusBadge";
import { ORDER_STATUS, nextOrderStatuses } from "@/lib/constants";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

/**
 * تغيير حالة الطلب (من الليستة أو صفحة التفاصيل).
 * بيعرض بس الحالات المسموحة: الخطوة الجاية + "ملغي". "ملغي" محتاج تأكيد.
 * "تم" و"ملغي" حالات نهائية => بيظهر بادج بس.
 */
const statusPulse = Object.fromEntries(Object.keys(ORDER_STATUS).map((s) => [s, { scale: [1, 1.06, 1], transition: { duration: 0.3 } }]));

export default function OrderStatusSelect({ order, className }) {
  const queryClient = useQueryClient();
  const selectId = useId();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const options = nextOrderStatuses(order.status);

  const mutation = useMutation({
    mutationFn: (status) => ordersApi.updateStatus(order.id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(["order", updated.id], updated);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`طلب #${updated.orderNumber}: ${ORDER_STATUS[updated.status]?.label}`);
      setConfirmCancel(false);
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة في تغيير الحالة"),
  });

  if (!options.length) return <OrderStatusBadge status={order.status} className={cn("min-h-[32px] text-sm", className)} />;

  const onChange = (e) => {
    const next = e.target.value;
    if (next === order.status) return;
    if (next === "cancelled") setConfirmCancel(true);
    else mutation.mutate(next);
  };

  return (
    // الكليك جوه الـ select ما يفتحش صفحة الطلب (الصف كله clickable)
    // نبضة خفيفة لما الحالة تتغير (من غير remount عشان الـ focus يفضل على الـ select)
    <m.div
      variants={statusPulse}
      initial={false}
      animate={order.status}
      className={cn("relative inline-flex", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <label htmlFor={selectId} className="sr-only">حالة الطلب #{order.orderNumber}</label>
      <select
        id={selectId}
        value={order.status}
        onChange={onChange}
        disabled={mutation.isPending}
        className={cn(
          "min-h-[44px] w-full cursor-pointer appearance-none rounded-full border-0 pe-10 ps-4 text-sm font-bold transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
          ORDER_STATUS[order.status]?.badge
        )}
      >
        <option value={order.status} className="bg-white text-ink">{ORDER_STATUS[order.status]?.label}</option>
        {options.map((s) => (
          <option key={s} value={s} className="bg-white text-ink">
            {s === "cancelled" ? "إلغاء الطلب" : ORDER_STATUS[s].label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-3 grid place-items-center">
        {mutation.isPending
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          : <ChevronDown className="h-4 w-4" aria-hidden />}
      </span>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="إلغاء الطلب"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2 min-[400px]:flex-row min-[400px]:gap-3">
            <Button variant="ghost" block onClick={() => setConfirmCancel(false)} disabled={mutation.isPending}>
              رجوع
            </Button>
            <Button variant="danger" block loading={mutation.isPending} onClick={() => mutation.mutate("cancelled")} className="whitespace-nowrap !px-4">
              أيوه، الغي الطلب
            </Button>
          </div>
        }
      >
        <p className="text-sm font-semibold leading-relaxed text-ink">
          متأكد إنك عايز تلغي طلب <strong className="text-brand-red">#{order.orderNumber}</strong>؟
          الإلغاء نهائي ومش هيتحسب في ملخص التحضير.
        </p>
      </Modal>
    </m.div>
  );
}
