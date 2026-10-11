import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealsApi, addonsApi } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import Modal from "@/components/common/Modal";
import Reveal from "@/components/common/Reveal";
import LottieAnimation from "@/components/common/LottieAnimation";
import MealPlaceholder from "@/components/customer/MealPlaceholder";
import MealForm from "@/components/admin/MealForm";
import { MEAL_CATEGORIES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { toast } from "@/store/useToastStore";
import { Plus, Edit2, Trash2, Search, AlertCircle, RefreshCw } from "lucide-react";
import Input from "@/components/common/Input";
import { cn } from "@/lib/cn";

export default function Meals() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState({ open: false, meal: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // meal to delete

  // جلب الوجبات
  const {
    data: meals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["meals"],
    queryFn: mealsApi.list,
  });

  // جلب الإضافات لعرض أسمائها مع الوجبة
  const { data: addons = [] } = useQuery({
    queryKey: ["addons"],
    queryFn: addonsApi.list,
  });

  const addonsMap = useMemo(() => {
    const map = new Map();
    for (const a of addons) {
      map.set(a.id, a.name);
    }
    return map;
  }, [addons]);

  // تبديل حالة التوفر السريع
  const toggleAvailableMutation = useMutation({
    mutationFn: ({ id, isAvailable }) =>
      mealsApi.update(id, { isAvailable }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      toast.info(
        updated.isAvailable
          ? `الوجبة "${updated.name}" أصبحت متاحة للطلب`
          : `الوجبة "${updated.name}" تم إيقافها عن الطلب`
      );
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تعديل حالة الوجبة");
    },
  });

  // حذف الوجبة
  const deleteMutation = useMutation({
    mutationFn: (id) => mealsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyMenu"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      toast.success("تم حذف الوجبة بنجاح");
      setDeleteConfirm(null);
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف الوجبة");
    },
  });

  const filteredMeals = useMemo(() => {
    if (!search.trim()) return meals;
    const q = search.trim().toLowerCase();
    return meals.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [meals, search]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-soft">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 text-brand-red" />
        <h2 className="text-xl font-bold">تعذر تحميل الوجبات</h2>
        <p className="mt-2 text-sm text-ink-soft">{error?.message || "حدث خطأ غير متوقع"}</p>
        <Button onClick={() => refetch()} className="mt-6">
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink md:text-3xl">
            الوجبات
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            إدارة قائمة الأطعمة وتفاصيلها، وربط الإضافات وإيقاف/تفعيل الطلب.
          </p>
        </div>
        <Button
          onClick={() => setFormModal({ open: true, meal: null })}
          className="min-h-[44px] shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-5 w-5" aria-hidden />
          وجبة جديدة
        </Button>
      </div>

      {/* حقل البحث وإجمالي العدد */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Input
            placeholder="بحث في الوجبات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
          <Search className="pointer-events-none absolute start-3 top-3.5 h-5 w-5 text-ink-soft" aria-hidden />
        </div>
        <span className="text-sm font-bold text-ink-soft">
          إجمالي الوجبات: {filteredMeals.length}
        </span>
      </div>

      {filteredMeals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/20 bg-white p-10 text-center shadow-soft">
          <LottieAnimation name="noResults" size={132} className="mx-auto mb-1" />
          <p className="text-base font-bold text-ink-soft">
            لا توجد وجبات مسجلة مطابقة.
          </p>
          <Button
            variant="outline"
            onClick={() => setFormModal({ open: true, meal: null })}
            className="mt-4"
          >
            إضافة وجبة الآن
          </Button>
        </div>
      ) : (
        <>
          {/* كروت الموبايل (أقل من 768px) */}
          <div className="grid gap-3 md:hidden">
            {filteredMeals.map((meal, i) => {
              const catLabel = MEAL_CATEGORIES[meal.category] || meal.category;
              const addonNames = (meal.addons || [])
                .map((aid) => (typeof aid === "object" ? aid.name : addonsMap.get(aid)))
                .filter(Boolean);

              return (
                <Reveal index={i}
                  key={meal.id}
                  className="flex flex-col gap-3 rounded-3xl border-2 border-ink/10 bg-white p-4 shadow-soft transition-colors hover:border-brand-red/30"
                >
                  <div
                    onClick={() => setFormModal({ open: true, meal })}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    {/* صورة 60x60 */}
                    <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-2xl">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-base font-extrabold text-ink">
                          {meal.name}
                        </h3>
                        <span className="shrink-0 text-sm font-black text-brand-red">
                          {formatPrice(meal.price)}
                        </span>
                      </div>
                      <span className="mt-0.5 inline-block rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {catLabel}
                      </span>
                      {meal.description && (
                        <p className="mt-1 line-clamp-1 text-xs text-ink-soft">
                          {meal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* الإضافات إن وجدت */}
                  {addonNames.length > 0 && (
                    <div className="text-xs text-ink-soft">
                      <span className="font-semibold text-ink">الإضافات: </span>
                      {addonNames.join("، ")}
                    </div>
                  )}

                  {/* الإجراءات والتوفر */}
                  <div className="flex items-center justify-between border-t border-ink/10 pt-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={meal.isAvailable}
                        onChange={() =>
                          toggleAvailableMutation.mutate({
                            id: meal.id,
                            isAvailable: !meal.isAvailable,
                          })
                        }
                        className="h-5 w-5 rounded accent-brand-red"
                      />
                      <span
                        className={cn(
                          "text-xs font-bold",
                          meal.isAvailable ? "text-green-600" : "text-ink-soft"
                        )}
                      >
                        {meal.isAvailable ? "متاح للطلب" : "غير متاح"}
                      </span>
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setFormModal({ open: true, meal })}
                        aria-label={`تعديل ${meal.name}`}
                        className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-ink/5"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(meal)}
                        aria-label={`حذف ${meal.name}`}
                        className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {/* جدول الشاشات الكبيرة (768px+) */}
          <div className="hidden overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft md:block">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-ink/10 bg-cream-dark/60 text-xs font-extrabold text-ink">
                <tr>
                  <th className="px-5 py-4 text-start">الوجبة</th>
                  <th className="px-4 py-4 text-start">القسم</th>
                  <th className="px-4 py-4 text-start">السعر</th>
                  <th className="px-4 py-4 text-start">الإضافات المتاحة</th>
                  <th className="px-4 py-4 text-center">التوفر</th>
                  <th className="px-5 py-4 text-end">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {filteredMeals.map((meal, i) => {
                  const catLabel = MEAL_CATEGORIES[meal.category] || meal.category;
                  const addonNames = (meal.addons || [])
                    .map((aid) => (typeof aid === "object" ? aid.name : addonsMap.get(aid)))
                    .filter(Boolean);

                  return (
                    <Reveal as="tr" index={i}
                      key={meal.id}
                      className="group cursor-pointer transition-colors hover:bg-cream/40"
                      onClick={() => setFormModal({ open: true, meal })}
                    >
                      {/* الوجبة مع الصورة والوصف */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink/10">
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
                          <div className="min-w-0">
                            <span className="block font-bold text-ink group-hover:text-brand-red">
                              {meal.name}
                            </span>
                            {meal.description && (
                              <span className="block max-w-xs truncate text-xs text-ink-soft">
                                {meal.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* القسم */}
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-cream-dark px-3 py-1 text-xs font-semibold text-ink">
                          {catLabel}
                        </span>
                      </td>

                      {/* السعر */}
                      <td className="px-4 py-3.5 font-extrabold text-brand-red">
                        {formatPrice(meal.price)}
                      </td>

                      {/* الإضافات */}
                      <td className="px-4 py-3.5 text-xs text-ink-soft">
                        {addonNames.length > 0 ? (
                          <span className="line-clamp-2 max-w-xs">
                            {addonNames.join("، ")}
                          </span>
                        ) : (
                          <span className="italic text-ink-soft">بدون إضافات</span>
                        )}
                      </td>

                      {/* التوفر */}
                      <td
                        className="px-4 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={meal.isAvailable}
                            onChange={() =>
                              toggleAvailableMutation.mutate({
                                id: meal.id,
                                isAvailable: !meal.isAvailable,
                              })
                            }
                            className="h-5 w-5 rounded accent-brand-red"
                          />
                          <span
                            className={cn(
                              "text-xs font-bold",
                              meal.isAvailable
                                ? "text-green-600"
                                : "text-ink-soft"
                            )}
                          >
                            {meal.isAvailable ? "متاح" : "معطل"}
                          </span>
                        </label>
                      </td>

                      {/* الإجراءات */}
                      <td
                        className="px-5 py-3.5 text-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormModal({ open: true, meal })}
                            aria-label={`تعديل ${meal.name}`}
                            className="grid h-11 w-11 place-items-center rounded-full text-ink transition hover:bg-ink/10"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(meal)}
                            aria-label={`حذف ${meal.name}`}
                            className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </Reveal>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* مودال الفورم (إنشاء / تعديل) */}
      {formModal.open && (
        <MealForm
          open={formModal.open}
          onClose={() => setFormModal({ open: false, meal: null })}
          meal={formModal.meal}
          onSuccess={() => refetch()}
        />
      )}

      {/* مودال تأكيد الحذف */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد حذف الوجبة"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="ghost"
              block
              onClick={() => setDeleteConfirm(null)}
              disabled={deleteMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              variant="danger"
              block
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteConfirm.id)}
            >
              نعم، احذف
            </Button>
          </div>
        }
      >
        <p className="text-sm font-semibold leading-relaxed text-ink">
          هل أنت متأكد من حذف وجبة{" "}
          <strong className="text-brand-red">&quot;{deleteConfirm?.name}&quot;</strong>؟
          سيتم إزالتها من قاعدة البيانات والجداول الأسبوعية.
        </p>
      </Modal>
    </div>
  );
}
