import { useState, useMemo } from "react";
import { Plus, Check } from "lucide-react";
import Modal from "@/components/common/Modal";
import LottieAnimation from "@/components/common/LottieAnimation";
import SearchInput from "@/components/common/SearchInput";
import FilterChips from "./FilterChips";
import MealPlaceholder from "@/components/customer/MealPlaceholder";
import { formatPrice } from "@/lib/format";
import { MEAL_CATEGORIES } from "@/lib/constants";
import { useAdminMenuStore } from "@/store/useAdminMenuStore";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";
import { withLam } from "@/lib/dates";
import { filterMeals, mealCategoryOptions } from "@/lib/filters";

// الفوكس على البحث في الديسكتوب بس (في الموبايل الكيبورد كان بيفتح ويغطي القايمة)
const isDesktop = () => typeof window !== "undefined" && window.matchMedia?.("(min-width: 768px)").matches;

export default function AddMealModal({
  open,
  onClose,
  dayKey,
  dayName,
  currentMealIds = [],
  onAddMeal,
}) {
  const meals = useAdminMenuStore((s) => s.meals);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [autoFocus] = useState(isDesktop);

  const categories = useMemo(() => mealCategoryOptions(meals, MEAL_CATEGORIES), [meals]);
  const filteredMeals = useMemo(() => filterMeals(meals, { q: search, category }), [meals, search, category]);

  const handleSelect = async (meal) => {
    if (currentMealIds.includes(meal.id)) return;
    try {
      await onAddMeal(dayKey, meal.id);
      toast.success(`تمت إضافة "${meal.name}" ${withLam(dayName)}`);
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء إضافة الوجبة");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`إضافة وجبة إلى يوم ${dayName || ""}`}
      fullOnMobile={true}
      size="md"
    >
      <div className="space-y-4">
        {/* البحث + شرايح الأقسام (لو الوجبات فيها أقسام) */}
        <SearchInput value={search} onChange={setSearch} label="بحث في الوجبات" placeholder="ابحث بالاسم أو الوصف..." autoFocus={autoFocus} />
        {categories.length > 1 && (
          <FilterChips
            label="فلترة بالقسم"
            options={[{ value: "", label: "الكل" }, ...categories]}
            value={category}
            onChange={setCategory}
          />
        )}

        {/* قائمة الوجبات */}
        <div className="space-y-2 max-h-[60dvh] overflow-y-auto pe-1">
          {filteredMeals.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <LottieAnimation name="noResults" size={110} />
              <p className="text-sm font-semibold text-ink-soft">مفيش نتايج</p>
              {(search || category) && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCategory(""); }}
                  className="mt-2 min-h-[44px] rounded-full px-4 text-sm font-bold text-brand-red transition hover:bg-brand-red/10"
                >
                  مسح البحث
                </button>
              )}
            </div>
          ) : (
            filteredMeals.map((meal) => {
              const isAdded = currentMealIds.includes(meal.id);
              const catLabel = MEAL_CATEGORIES[meal.category] || meal.category;

              return (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => handleSelect(meal)}
                  disabled={isAdded}
                  className={cn(
                    "flex w-full min-h-[56px] items-center gap-3 rounded-2xl border-2 p-3 text-start transition",
                    isAdded
                      ? "cursor-not-allowed border-ink/10 bg-black/5 opacity-60"
                      : "cursor-pointer border-ink/10 bg-white hover:border-brand-red hover:shadow-soft active:scale-[.99]"
                  )}
                >
                  {/* صورة مصغرة */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    {meal.image ? (
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <MealPlaceholder className="h-full w-full" />
                    )}
                  </div>

                  {/* التفاصيل */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-bold text-ink">
                        {meal.name}
                      </h4>
                      <span className="shrink-0 rounded-full bg-cream-dark px-2 py-0.5 text-xs font-semibold text-ink">
                        {catLabel}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-brand-red">
                      {formatPrice(meal.price)}
                    </span>
                  </div>

                  {/* حالة الإضافة */}
                  <div className="shrink-0">
                    {isAdded ? (
                      <span className="flex items-center gap-1 rounded-full bg-ink/10 px-2.5 py-1 text-xs font-bold text-ink">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        مضاف
                      </span>
                    ) : (
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-red/10 text-brand-red transition hover:bg-brand-red hover:text-white">
                        <Plus className="h-5 w-5" aria-hidden />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
