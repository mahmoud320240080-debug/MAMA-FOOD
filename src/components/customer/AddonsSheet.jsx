import { useState, useMemo, useEffect } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import QuantityStepper from "./QuantityStepper";
import { formatPrice } from "@/lib/format";
import { formatDayMonth, fromDateKey, withLam } from "@/lib/dates";
import { DAY_KEYS, DAY_NAMES_AR } from "@/lib/constants";
import { useCartStore } from "@/store/useCartStore";
import { cn } from "@/lib/cn";
import { flyToCart } from "@/lib/flyToCart";
import { haptic } from "@/lib/haptics";

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
  useEffect(() => {
    if (open) {
      setCheckedAddons(new Set());
      setNote("");
      setQuantity(1);
      setCopyDays([]);
      setShowCopy(false);
    }
  }, [open, meal?.id, date]);

  // صياغة اسم اليوم والتاريخ (مثال: "للأحد ١١ أكتوبر")
  const dayLabel = useMemo(() => {
    if (!date) return "";
    const d = fromDateKey(date);
    const dayKey = DAY_KEYS[d.getDay()];
    const dayName = DAY_NAMES_AR[dayKey] || "";
    return `${withLam(dayName)} ${formatDayMonth(date)}`;
  }, [date]);

  // حساب الإجمالي الحي
  const total = useMemo(() => {
    if (!meal) return 0;
    const addonsTotal = (meal.addons || [])
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

  const handleSubmit = (e) => {
    if (!meal) return;
    // الوجبة بتطير من زرار "أضف للسلة" لأيقونة السلة
    flyToCart(e?.currentTarget, { image: meal.image });
    haptic();
    const selectedAddons = (meal.addons || []).filter((a) => checkedAddons.has(a.id));
    const targetDates = [date, ...copyDays];

    for (const d of targetDates) {
      addItem({
        date: d,
        mealId: meal.id,
        name: meal.name,
        price: meal.price,
        addons: selectedAddons,
        note,
        quantity,
      });
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
      footer={
        <Button block size="lg" onClick={handleSubmit}>
          أضف للسلة — {formatPrice(total)}
        </Button>
      }
    >
      <div>
        <p className="mb-4 text-sm font-semibold text-ink-soft">
          {dayLabel}
        </p>

        {/* قائمة الإضافات */}
        {meal.addons && meal.addons.length > 0 && (
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
                  <span className={cn("text-sm font-bold", addon.price === 0 ? "text-ink" : "text-brand-red")}>
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
    </BottomSheet>
  );
}
