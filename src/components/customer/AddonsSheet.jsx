import { useState, useMemo } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import QuantityStepper from "./QuantityStepper";
import { formatPrice } from "@/lib/format";
import { formatDayMonth } from "@/lib/dates";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/cn";

/**
 * شيت الإضافات — بيظهر كباتم شيت على الموبايل وmodal في النص على الديسكتوب.
 * بيعرض إضافات وجبة معينة ليوم معين، مع ملاحظة وكمية.
 */
export default function AddonsSheet({ open, onClose, meal, date, selectedDates, days }) {
  const addItem = useCartStore((s) => s.addItem);
  const [checkedAddons, setCheckedAddons] = useState(new Set());
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [copyDays, setCopyDays] = useState([]);
  const [showCopy, setShowCopy] = useState(false);

  // ريست الستيت لما يتفتح من جديد
  const handleOpen = () => {
    setCheckedAddons(new Set());
    setNote("");
    setQuantity(1);
    setCopyDays([]);
    setShowCopy(false);
  };

  // حساب الإجمالي الحي
  const total = useMemo(() => {
    if (!meal) return 0;
    const addonsTotal = meal.addons
      .filter((a) => checkedAddons.has(a.id))
      .reduce((s, a) => s + a.price, 0);
    return (meal.price + addonsTotal) * quantity;
  }, [meal, checkedAddons, quantity]);

  const toggleAddon = (addonId) => {
    setCheckedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) next.delete(addonId);
      else next.add(addonId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!meal) return;
    const selectedAddons = meal.addons.filter((a) => checkedAddons.has(a.id));
    const targetDates = [date, ...copyDays];

    for (const d of targetDates) {
      for (let i = 0; i < quantity; i++) {
        addItem({
          date: d,
          mealId: meal.id,
          name: meal.name,
          price: meal.price,
          addons: selectedAddons,
          note,
        });
      }
    }
    onClose();
  };

  // الأيام اللي ممكن ننسخ ليها (المحددة ما عدا اليوم الحالي)
  const otherDays = useMemo(() => {
    if (!date || !selectedDates) return [];
    return selectedDates
      .filter((d) => d !== date)
      .map((d) => {
        const dayData = days?.find((dd) => dd.date === d);
        // تأكد إن الوجبة موجودة في اليوم ده
        const hasMeal = dayData?.meals?.some((m) => m.id === meal?.id);
        return { date: d, dayName: dayData?.dayName, hasMeal };
      })
      .filter((d) => d.hasMeal);
  }, [date, selectedDates, days, meal]);

  if (!meal) return null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      desktop="center"
      title={meal.name}
    >
      {/* الباطن */}
      <div onAnimationEnd={open ? handleOpen : undefined}>
        <p className="mb-4 text-sm text-ink-soft">
          لـ{formatDayMonth(date)}
        </p>

        {/* قائمة الإضافات */}
        {meal.addons.length > 0 && (
          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-bold">الإضافات</legend>
            <div className="space-y-2">
              {meal.addons.map((addon) => (
                <label
                  key={addon.id}
                  className={cn(
                    "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition",
                    checkedAddons.has(addon.id)
                      ? "border-brand-red bg-brand-red/5"
                      : "border-ink/10 hover:border-ink/20"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checkedAddons.has(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="h-5 w-5 rounded border-ink/30 text-brand-red accent-brand-red"
                  />
                  <span className="flex-1 font-semibold">{addon.name}</span>
                  <span className={cn("text-sm", addon.price === 0 ? "text-green-600 font-semibold" : "text-ink-soft")}>
                    {addon.price === 0 ? "مجاني" : `+${formatPrice(addon.price)}`}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* ملاحظة */}
        <Input
          as="textarea"
          label="ملاحظة (اختياري)"
          placeholder="مثال: من غير بصل..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[72px]"
        />

        {/* كمية */}
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold">الكمية</span>
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} />
        </div>

        {/* نسخ لأيام تانية */}
        {otherDays.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowCopy(!showCopy)}
              className="text-sm font-bold text-brand-red underline decoration-brand-red/30 underline-offset-2 transition hover:decoration-brand-red"
            >
              انسخ نفس الاختيار لأيام تانية
            </button>
            {showCopy && (
              <div className="mt-2 space-y-2">
                {otherDays.map((d) => (
                  <label
                    key={d.date}
                    className="flex min-h-[44px] items-center gap-3 rounded-2xl border-2 border-ink/10 px-4 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={copyDays.includes(d.date)}
                      onChange={() =>
                        setCopyDays((prev) =>
                          prev.includes(d.date)
                            ? prev.filter((x) => x !== d.date)
                            : [...prev, d.date]
                        )
                      }
                      className="h-5 w-5 rounded accent-brand-red"
                    />
                    <span className="font-semibold">
                      {d.dayName} — {formatDayMonth(d.date)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* فوتر بزرار الإضافة والإجمالي */}
      <div className="mt-4 border-t border-ink/10 pt-4">
        <Button block onClick={handleSubmit}>
          أضف للسلة — {formatPrice(total)}
        </Button>
      </div>
    </BottomSheet>
  );
}
