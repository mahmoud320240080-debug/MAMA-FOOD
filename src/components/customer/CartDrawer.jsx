import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock, ShoppingBag, Undo2 } from "lucide-react";
import { menuApi } from "@/api";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import LottieAnimation from "@/components/common/LottieAnimation";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/format";
import { formatDayLabel, formatDayMonth, getLockedDates } from "@/lib/dates";
import { groupItemsByDate, daySubtotal, cartSubtotal } from "@/lib/cart";
import CartLine from "./CartLine";
import LockedDaysModal from "./LockedDaysModal";

/**
 * درور السلة — بوتوم شيت على الموبايل، سايد درور على الديسكتوب
 */
export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const selectedDates = useCartStore((s) => s.selectedDates);
  const toggleDate = useCartStore((s) => s.toggleDate);
  const lastRemoved = useCartStore((s) => s._lastRemoved);
  const undoRemove = useCartStore((s) => s.undoRemove);

  const [warningOpen, setWarningOpen] = useState(false);
  const [lockedOpen, setLockedOpen] = useState(false);

  const grouped = groupItemsByDate(items);
  const sortedDates = Object.keys(grouped).sort();
  const total = cartSubtotal(items);
  const isEmpty = items.length === 0;

  // أيام في السلة اتقفلت: بنجيب الإعدادات من جديد كل ما السلة تتفتح ونحسب بالوقت الحالي
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: menuApi.getSettings, staleTime: 0, enabled: open });
  const lockedDates = open && settings ? getLockedDates(sortedDates, settings) : [];

  // أيام مختارة بدون وجبات
  const emptyDays = selectedDates.filter((d) => !items.some((it) => it.date === d));

  const handleCheckoutClick = () => {
    // تحقق تاني لحظة الضغط (ممكن يوم يكون اتقفل والسلة مفتوحة)
    if (settings && getLockedDates(sortedDates, settings).length > 0) {
      setLockedOpen(true);
    } else if (emptyDays.length > 0) {
      setWarningOpen(true);
    } else {
      onClose();
      navigate("/checkout");
    }
  };

  const proceedWithoutEmptyDays = () => {
    setWarningOpen(false);
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        desktop="side"
        title="سلتك"
        footer={
          !isEmpty && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>المجموع</span>
                <span className="text-brand-red">{formatPrice(total)}</span>
              </div>
              <Button block onClick={handleCheckoutClick}>
                <ShoppingBag className="h-5 w-5" aria-hidden />
                كمّل الطلب
              </Button>
            </div>
          )
        }
      >
        {isEmpty ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <LottieAnimation name="emptyCart" size={150} />
            <h3 className="text-xl font-bold">السلة فاضية</h3>
            <p className="max-w-xs text-ink-soft">
              اختار أيامك ووجباتك من الصفحة الرئيسية وابدأ اطلب
            </p>
            <Button variant="outline" onClick={onClose}>
              ارجع للمنيو
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Undo toast */}
            {lastRemoved && (
              <button
                type="button"
                onClick={undoRemove}
                className="flex w-full items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                <Undo2 className="h-4 w-4" aria-hidden />
                <span>تم حذف {lastRemoved.name}.</span>
                <span className="me-auto text-brand-yellow underline">تراجع</span>
              </button>
            )}

            {lockedDates.length > 0 && (
              <div role="alert" className="rounded-2xl border-2 border-brand-red bg-white p-4">
                <p className="flex items-center gap-2 font-bold text-ink">
                  <Lock className="h-4 w-4 shrink-0 text-brand-red" aria-hidden />
                  الطلب اتقفل على {lockedDates.map(formatDayLabel).join("، ")}
                </p>
                <p className="mt-1 text-sm text-ink-soft">وجبات اليوم ده مش هتتبعت. شيلها عشان تكمّل.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setLockedOpen(true)}>
                  شيل الأيام المقفولة
                </Button>
              </div>
            )}

            {sortedDates.map((date) => {
              const dayItems = grouped[date];
              return (
                <div key={date}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-bold">
                      {formatDayMonth(date)}
                      {lockedDates.includes(date) && (
                        <span className="rounded-full bg-ink/10 px-2 py-0.5 text-xs font-semibold text-ink-soft">مقفول</span>
                      )}
                    </h3>
                    <span className="text-sm font-semibold text-brand-red">
                      {formatPrice(daySubtotal(dayItems))}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayItems.map((item) => (
                      <CartLine key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BottomSheet>

      <LockedDaysModal open={lockedOpen} dates={lockedDates} onClose={() => setLockedOpen(false)} />

      {/* مودال تنبيه الأيام المختارة بدون وجبات */}
      <Modal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        title="أيام مختارة بدون وجبات"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" block onClick={() => setWarningOpen(false)}>
              رجوع
            </Button>
            <Button variant="secondary" block onClick={proceedWithoutEmptyDays}>
              كمّل بدونه
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm text-ink-soft">
          عندك أيام حددتها في جدولك بس ما أضفتش ليها أي وجبات:
        </p>
        <div className="space-y-2.5">
          {emptyDays.map((d) => (
            <div
              key={d}
              className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-3.5"
            >
              <span className="font-bold text-ink">{formatDayMonth(d)}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toggleDate(d);
                  if (emptyDays.length <= 1) {
                    setWarningOpen(false);
                  }
                }}
              >
                شيل اليوم ده
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
