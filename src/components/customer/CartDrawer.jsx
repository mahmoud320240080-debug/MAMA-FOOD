import { useNavigate } from "react-router-dom";
import { ShoppingBag, Undo2 } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/common/Button";
import { LogoIcon } from "@/components/common/Logo";
import { useCartStore } from "@/store/useCartStore";
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { groupItemsByDate, daySubtotal, cartSubtotal } from "@/lib/cart";
import CartLine from "./CartLine";

/**
 * درور السلة — بوتوم شيت على الموبايل، سايد درور على الديسكتوب
 */
export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const lastRemoved = useCartStore((s) => s._lastRemoved);
  const undoRemove = useCartStore((s) => s.undoRemove);

  const grouped = groupItemsByDate(items);
  const sortedDates = Object.keys(grouped).sort();
  const total = cartSubtotal(items);
  const isEmpty = items.length === 0;

  const handleCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
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
            <Button block onClick={handleCheckout}>
              <ShoppingBag className="h-5 w-5" aria-hidden />
              كمّل الطلب
            </Button>
          </div>
        )
      }
    >
      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-chef-pattern">
            <LogoIcon tone="onRed" className="w-10" />
          </div>
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

          {sortedDates.map((date) => {
            const dayItems = grouped[date];
            return (
              <div key={date}>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold">{formatDayMonth(date)}</h3>
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
  );
}
