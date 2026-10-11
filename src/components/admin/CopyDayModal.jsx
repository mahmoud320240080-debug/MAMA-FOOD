import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { toast } from "@/store/useToastStore";
import { AlertCircle } from "lucide-react";

export default function CopyDayModal({
  open,
  onClose,
  initialFromDay,
  days = [],
  onCopy,
}) {
  const [fromDay, setFromDay] = useState(initialFromDay || days[0]?.key || "sat");
  const [toDay, setToDay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialFromDay) {
      setFromDay(initialFromDay);
      // Select another day as initial destination
      const other = days.find((d) => d.key !== initialFromDay);
      if (other) setToDay(other.key);
    }
  }, [initialFromDay, days]);

  const fromDayObj = days.find((d) => d.key === fromDay);
  const toDayObj = days.find((d) => d.key === toDay);

  const handleCopy = async () => {
    if (!fromDay || !toDay) return;
    if (fromDay === toDay) {
      toast.error("لا يمكن النسخ إلى نفس اليوم");
      return;
    }

    setIsSubmitting(true);
    try {
      await onCopy(fromDay, toDay);
      toast.success(`تم نسخ وجبات ${fromDayObj?.name} إلى ${toDayObj?.name}`);
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء نسخ الوجبات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="نسخ جدول يوم ليوم آخر"
      size="sm"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            variant="primary"
            block
            onClick={handleCopy}
            loading={isSubmitting}
            disabled={!fromDay || !toDay || fromDay === toDay}
          >
            انسخ
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* من يوم */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink">
            من يوم (المصدر):
          </label>
          <select
            value={fromDay}
            onChange={(e) => setFromDay(e.target.value)}
            className="min-h-[48px] w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base font-semibold text-ink transition focus:border-brand-red focus:outline-none"
          >
            {days.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* إلى يوم */}
        <div>
          <label className="mb-1.5 block text-sm font-bold text-ink">
            إلى يوم (الوجهة):
          </label>
          <select
            value={toDay}
            onChange={(e) => setToDay(e.target.value)}
            className="min-h-[48px] w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base font-semibold text-ink transition focus:border-brand-red focus:outline-none"
          >
            {days.map((d) => (
              <option key={d.key} value={d.key} disabled={d.key === fromDay}>
                {d.name} {d.key === fromDay ? "(المصدر)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* تحذير الاستبدال */}
        <div className="flex items-start gap-3 rounded-2xl border border-brand-yellow bg-brand-yellow-soft p-3.5 text-ink">
          <AlertCircle className="h-5 w-5 shrink-0 text-ink mt-0.5" aria-hidden />
          <p className="text-sm font-bold leading-relaxed">
            تنبيه: هذا الإجراء سيحل محل جميع الوجبات الموجودة حالياً في{" "}
            <span className="font-extrabold text-brand-red underline">
              {toDayObj?.name || "اليوم المحدد"}
            </span>
            .
          </p>
        </div>
      </div>
    </Modal>
  );
}
