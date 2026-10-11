import { Lock } from "lucide-react";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import { useCartStore } from "@/store/useCartStore";
import { formatDayLabel } from "@/lib/dates";

/**
 * أيام في السلة اتقفلت والزبون لسه بيطلب (السلة والـ Checkout).
 * نفس شكل تنبيه "أيام مختارة بدون وجبات": كل يوم في سطر وجنبه زرار يشيل وجباته.
 * بيتقفل لوحده لما مايفضلش أيام مقفولة (الأب بيبعت dates محسوبة من getLockedDates).
 */
export default function LockedDaysModal({ open, dates, onClose }) {
  const removeDay = useCartStore((s) => s.removeDay);

  return (
    <Modal
      open={open && dates.length > 0}
      onClose={onClose}
      title="أيام اتقفل الطلب عليها"
      size="sm"
      footer={
        <Button variant="ghost" block onClick={onClose}>
          رجوع
        </Button>
      }
    >
      <p className="mb-4 text-sm text-ink-soft">
        ميعاد الطلب للأيام دي خلص، فوجباتها مش هتتبعت. شيلها من السلة عشان تكمّل طلبك:
      </p>
      <div className="space-y-2.5">
        {dates.map((d) => (
          <div key={d} className="flex items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white p-3.5">
            <span className="flex min-w-0 items-center gap-2 font-bold text-ink">
              <Lock className="h-4 w-4 shrink-0 text-brand-red" aria-hidden />
              {formatDayLabel(d)}
            </span>
            <Button size="sm" variant="outline" className="shrink-0" onClick={() => removeDay(d)}>
              شيل وجباته
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
