import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useAdminMenuStore } from "@/store/useAdminMenuStore";
import { getUpcomingDates, formatDayMonth } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import Modal from "@/components/common/Modal";
import Reveal from "@/components/common/Reveal";
import LottieAnimation from "@/components/common/LottieAnimation";
import MealPlaceholder from "@/components/customer/MealPlaceholder";
import AddMealModal from "@/components/admin/AddMealModal";
import CopyDayModal from "@/components/admin/CopyDayModal";
import { toast } from "@/store/useToastStore";

const DAYS_CONFIG = [
  { key: "sat", name: "السبت" },
  { key: "sun", name: "الأحد" },
  { key: "mon", name: "الاثنين" },
  { key: "tue", name: "الثلاثاء" },
  { key: "wed", name: "الأربعاء" },
  { key: "thu", name: "الخميس" },
  { key: "fri", name: "الجمعة" },
];

export default function Menu() {
  const {
    meals,
    weeklyMenu,
    isLoading,
    error,
    fetchData,
    addMealToDay,
    removeMealFromDay,
    copyDayToDay,
  } = useAdminMenuStore();

  const [activeTab, setActiveTab] = useState("sat");
  const [addModal, setAddModal] = useState({ open: false, dayKey: "", dayName: "" });
  const [copyModal, setCopyModal] = useState({ open: false, fromDay: "" });
  const [removeConfirm, setRemoveConfirm] = useState(null); // { dayKey, dayName, meal }

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ربط الأيام مع التواريخ الأقرب لها للعرض
  const upcomingMap = useMemo(() => {
    const list = getUpcomingDates(14);
    const map = {};
    for (const item of list) {
      if (!map[item.dayKey]) {
        map[item.dayKey] = item.date;
      }
    }
    return map;
  }, []);

  // ماب للوجبات بالـ ID لتسهيل الوصول
  const mealsById = useMemo(() => {
    const map = new Map();
    for (const m of meals) {
      map.set(m.id, m);
    }
    return map;
  }, [meals]);

  const handleConfirmRemove = async () => {
    if (!removeConfirm) return;
    const { dayKey, meal, dayName } = removeConfirm;
    try {
      await removeMealFromDay(dayKey, meal.id);
      toast.success(`تم حذف "${meal.name}" من ${dayName}`);
      setRemoveConfirm(null);
    } catch {
      toast.error("حدث خطأ أثناء حذف الوجبة");
    }
  };

  const renderDayColumn = ({ key: dayKey, name: dayName }, isFullWidth = false, index = 0) => {
    const dayMealIds = weeklyMenu[dayKey] || [];
    const date = upcomingMap[dayKey];
    const formattedDate = date ? formatDayMonth(date) : "";

    return (
      <Reveal
        key={dayKey}
        index={index}
        className={cn(
          "flex flex-col rounded-3xl border-2 border-ink/10 bg-white p-4 shadow-soft transition-colors hover:border-brand-red/40",
          isFullWidth ? "w-full" : "w-72 min-w-[270px] max-w-[300px] shrink-0"
        )}
      >
        {/* هيدر اليوم */}
        <div className="mb-3 border-b border-ink/10 pb-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-ink">
              {dayName}
            </h3>
            <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-yellow px-1.5 text-xs font-bold text-ink">
              {dayMealIds.length}
            </span>
          </div>
          {formattedDate && (
            <p className="mt-0.5 text-xs font-semibold text-ink-soft">
              {formattedDate}
            </p>
          )}
        </div>

        {/* أزرار الإجراءات السريعة لليوم */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              setAddModal({ open: true, dayKey, dayName })
            }
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-brand-red/10 px-2.5 py-1 text-xs font-bold text-brand-red transition hover:bg-brand-red hover:text-white active:scale-95"
          >
            <Plus className="h-4 w-4" aria-hidden />
            إضافة وجبة
          </button>
          <button
            type="button"
            onClick={() => setCopyModal({ open: true, fromDay: dayKey })}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-ink/10 px-2.5 py-1 text-xs font-bold text-ink transition hover:bg-ink/5 active:scale-95"
          >
            <Copy className="h-4 w-4" aria-hidden />
            نسخ اليوم
          </button>
        </div>

        {/* قائمة وجبات اليوم بكروت أوضح وأكبر */}
        <div className="flex-1 space-y-3 min-h-[140px]">
          {dayMealIds.length === 0 ? (
            <div className="grid h-full min-h-[140px] place-items-center rounded-2xl border border-dashed border-ink/20 p-4 text-center">
              <LottieAnimation name="noMeals" size={72} />
              <p className="text-xs font-semibold text-ink-soft">
                مفيش وجبات محددة لليوم ده
              </p>
            </div>
          ) : (
            dayMealIds.map((mealId) => {
              const meal = mealsById.get(mealId) || {
                id: mealId,
                name: "وجبة غير معروفة",
                price: 0,
              };

              return (
                <div
                  key={mealId}
                  className="group flex items-center gap-3 rounded-2xl border border-ink/10 bg-cream/40 p-3 transition hover:border-brand-red/30 hover:bg-white hover:shadow-sm"
                >
                  {/* صورة أكبر وأوضح */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white shadow-xs">
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

                  {/* معلومات الوجبة: الاسم واضح في سطرين كحد أقصى + السعر بحجم أكبر */}
                  <div className="min-w-0 flex-1">
                    <h4
                      className="line-clamp-2 text-sm font-bold leading-snug text-ink"
                      title={meal.name}
                    >
                      {meal.name}
                    </h4>
                    <span className="mt-1 block text-sm font-extrabold text-brand-red">
                      {formatPrice(meal.price)}
                    </span>
                  </div>

                  {/* زر الحذف بحجم لمس مريح (min 44px) */}
                  <button
                    type="button"
                    onClick={() =>
                      setRemoveConfirm({ dayKey, dayName, meal })
                    }
                    aria-label={`حذف ${meal.name} من ${dayName}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red hover:text-white active:scale-95"
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Reveal>
    );
  };

  if (isLoading && meals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-hidden">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="w-72 shrink-0 space-y-3 rounded-3xl bg-white p-4 shadow-soft">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
        <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-brand-red" />
        <h2 className="text-xl font-bold">تعذر تحميل المنيو</h2>
        <p className="mt-2 text-sm text-ink-soft">{error}</p>
        <Button onClick={fetchData} className="mt-6">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const activeDayConfig = DAYS_CONFIG.find((d) => d.key === activeTab) || DAYS_CONFIG[0];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">
            المنيو الأسبوعي
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            حدد الوجبات المتاحة لكل يوم في الأسبوع — يتكرر الجدول تلقائياً كل أسبوع.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCopyModal({ open: true, fromDay: "sat" })}
            className="min-h-[44px]"
          >
            <Copy className="h-4 w-4" aria-hidden />
            نسخ يوم ليوم آخر
          </Button>
        </div>
      </div>

      {/* على شاشات الموبايل (أقل من md): تابات لعرض يوم واحد في المرة بكروت بعرض كامل */}
      <div className="space-y-4 md:hidden">
        {/* شريط تابات الأيام */}
        <div
          role="tablist"
          aria-label="أيام الأسبوع"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none"
        >
          {DAYS_CONFIG.map(({ key: dayKey, name: dayName }) => {
            const count = (weeklyMenu[dayKey] || []).length;
            const isActive = activeTab === dayKey;
            return (
              <button
                key={dayKey}
                role="tab"
                id={`tab-${dayKey}`}
                aria-selected={isActive}
                aria-controls={`panel-${dayKey}`}
                type="button"
                onClick={() => setActiveTab(dayKey)}
                className={cn(
                  "flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-bold transition active:scale-95",
                  isActive
                    ? "bg-brand-red text-white shadow-soft"
                    : "border border-ink/10 bg-white text-ink hover:bg-cream"
                )}
              >
                <span>{dayName}</span>
                <span
                  className={cn(
                    "grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-xs font-bold",
                    isActive ? "bg-brand-yellow text-ink" : "bg-ink/10 text-ink"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* كارت اليوم المختار بعرض كامل */}
        <div
          id={`panel-${activeDayConfig.key}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeDayConfig.key}`}
        >
          {renderDayColumn(activeDayConfig, true, 0)}
        </div>
      </div>

      {/* على الشاشات الأكبر (>= md): كل الأيام الـ 7 جنباً إلى جنب مع سكرول أفقي داخلي مريح */}
      <div className="hidden -mx-4 gap-4 overflow-x-auto px-4 pb-6 scrollbar-thin md:flex md:mx-0 md:px-0">
        {DAYS_CONFIG.map((day, idx) => renderDayColumn(day, false, idx))}
      </div>

      {/* مودال إضافة وجبة */}
      {addModal.open && (
        <AddMealModal
          open={addModal.open}
          onClose={() => setAddModal({ open: false, dayKey: "", dayName: "" })}
          dayKey={addModal.dayKey}
          dayName={addModal.dayName}
          currentMealIds={weeklyMenu[addModal.dayKey] || []}
          onAddMeal={addMealToDay}
        />
      )}

      {/* مودال نسخ اليوم */}
      {copyModal.open && (
        <CopyDayModal
          open={copyModal.open}
          onClose={() => setCopyModal({ open: false, fromDay: "" })}
          initialFromDay={copyModal.fromDay}
          days={DAYS_CONFIG}
          onCopy={copyDayToDay}
        />
      )}

      {/* مودال تأكيد الحذف */}
      <Modal
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="تأكيد حذف الوجبة"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              block
              onClick={() => setRemoveConfirm(null)}
            >
              إلغاء
            </Button>
            <Button variant="danger" block onClick={handleConfirmRemove}>
              نعم، احذف
            </Button>
          </div>
        }
      >
        <p className="text-sm font-semibold leading-relaxed text-ink">
          متأكد إنك عايز تشيل وجبة{" "}
          <strong className="text-brand-red">
            &quot;{removeConfirm?.meal?.name}&quot;
          </strong>{" "}
          من جدول يوم {removeConfirm?.dayName}؟
        </p>
      </Modal>
    </div>
  );
}
