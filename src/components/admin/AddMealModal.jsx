import { useState, useMemo } from "react";
import { Search, Plus, Check } from "lucide-react";
import Modal from "@/components/common/Modal";
import LottieAnimation from "@/components/common/LottieAnimation";
import Input from "@/components/common/Input";
import MealPlaceholder from "@/components/customer/MealPlaceholder";
import { formatPrice } from "@/lib/format";
import { MEAL_CATEGORIES } from "@/lib/constants";
import { useAdminMenuStore } from "@/store/useAdminMenuStore";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";
import { withLam } from "@/lib/dates";

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

  const filteredMeals = useMemo(() => {
    if (!search.trim()) return meals;
    const q = search.trim().toLowerCase();
    return meals.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [meals, search]);

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
        {/* حقل البحث */}
        <div className="relative">
          <Input
            placeholder="ابحث بالاسم أو الوصف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
            autoFocus
          />
          <Search className="pointer-events-none absolute start-3 top-3.5 h-5 w-5 text-ink-soft" aria-hidden />
        </div>

        {/* قائمة الوجبات */}
        <div className="space-y-2 max-h-[60dvh] overflow-y-auto pe-1">
          {filteredMeals.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <LottieAnimation name="noResults" size={110} />
              <p className="text-sm font-semibold text-ink-soft">مفيش وجبات مطابقة للبحث</p>
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
