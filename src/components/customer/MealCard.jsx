import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { MEAL_CATEGORIES } from "@/lib/constants";
import { useCartStore } from "@/store/useCartStore";
import MealPlaceholder from "./MealPlaceholder";
import QuantityStepper from "./QuantityStepper";

/**
 * كارت وجبة — بيعرض الصورة والاسم والوصف والسعر وزرار إضافة
 * @param {Object} props
 * @param {Object} props.meal - بيانات الوجبة
 * @param {string} props.date - تاريخ اليوم
 * @param {Function} props.onAddonsClick - لفتح شيت الإضافات
 */
export default function MealCard({ meal, date, onAddonsClick }) {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  // عدد الوجبة ده في اليوم ده (كل الخطوط)
  const dayMealItems = items.filter(
    (it) => it.date === date && it.mealId === meal.id
  );
  const totalQty = dayMealItems.reduce((s, it) => s + it.quantity, 0);

  const handleQuickAdd = () => {
    addItem({
      date,
      mealId: meal.id,
      name: meal.name,
      price: meal.price,
      addons: [],
      note: "",
    });
  };

  const hasAddons = meal.addons && meal.addons.length > 0;
  const catLabel = MEAL_CATEGORIES[meal.category] || meal.category;

  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition hover:shadow-pop">
      {/* صورة */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {meal.image ? (
          <img
            src={meal.image}
            alt={meal.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <MealPlaceholder className="h-full w-full" />
        )}
        {/* بادج القسم */}
        <span className="absolute start-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm">
          {catLabel}
        </span>
      </div>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-bold leading-snug">{meal.name}</h3>
        {meal.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
            {meal.description}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <span className="text-lg font-extrabold text-brand-red">
            {formatPrice(meal.price)}
          </span>

          <div className="flex items-center gap-2">
            {hasAddons && (
              <button
                type="button"
                onClick={() => onAddonsClick(meal, date)}
                className="min-h-[36px] rounded-full border-2 border-brand-red px-3 text-sm font-bold text-brand-red transition hover:bg-brand-red hover:text-white"
              >
                إضافات
              </button>
            )}
            {totalQty > 0 ? (
              <QuantityStepper
                value={totalQty}
                onChange={(q) => {
                  // لو فيه سطر واحد بس نغير كميته مباشرة
                  if (dayMealItems.length === 1) {
                    updateQuantity(dayMealItems[0].id, q);
                  } else {
                    // لو أكتر من سطر (إضافات مختلفة) بنفتح الشيت
                    onAddonsClick(meal, date);
                  }
                }}
                min={0}
              />
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`أضف ${meal.name}`}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-full bg-brand-red text-white shadow-pop transition",
                  "hover:bg-brand-red-dark active:scale-95"
                )}
              >
                <Plus className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
