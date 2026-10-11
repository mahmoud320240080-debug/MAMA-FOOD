import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealsApi, addonsApi } from "@/api";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import MealPlaceholder from "@/components/customer/MealPlaceholder";
import { MEAL_CATEGORIES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { toast } from "@/store/useToastStore";
import { Upload, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

const mealSchema = z.object({
  name: z.string().min(2, "اسم الوجبة يجب أن يكون حرفين على الأقل"),
  description: z.string().optional(),
  price: z.coerce.number().min(1, "السعر يجب أن يكون 1 جنيه على الأقل"),
  category: z.string().min(1, "يجب اختيار القسم"),
  isAvailable: z.boolean().default(true),
});

export default function MealForm({ open, onClose, meal, onSuccess }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [image, setImage] = useState(meal?.image || null);
  const [imageWarning, setImageWarning] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState(meal?.addons || []);

  // جلب قائمة الإضافات المتاحة
  const { data: addons = [] } = useQuery({
    queryKey: ["addons"],
    queryFn: addonsApi.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      name: meal?.name || "",
      description: meal?.description || "",
      price: meal?.price || "",
      category: meal?.category || "main",
      isAvailable: meal?.isAvailable ?? true,
    },
  });

  // تحديث القيم عند فتح المودال لو فيه وجبة محددة
  useEffect(() => {
    if (open) {
      reset({
        name: meal?.name || "",
        description: meal?.description || "",
        price: meal?.price || "",
        category: meal?.category || "main",
        isAvailable: meal?.isAvailable ?? true,
      });
      setImage(meal?.image || null);
      setImageWarning(false);
      // لو الوجبة فيها إضافات أوبجكت أو IDs نتعامل مع الاتنين
      const addonIds = (meal?.addons || []).map((a) => (typeof a === "object" ? a.id : a));
      setSelectedAddons(addonIds);
    }
  }, [open, meal, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        image,
        addons: selectedAddons,
      };
      if (meal?.id) {
        return mealsApi.update(meal.id, payload);
      }
      return mealsApi.create(payload);
    },
    onSuccess: (savedMeal) => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["weeklyMenu"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      toast.success(meal?.id ? `تم تعديل "${savedMeal.name}"` : `تم إنشاء "${savedMeal.name}"`);
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ الوجبة");
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setImageWarning(true);
    } else {
      setImageWarning(false);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meal ? "تعديل وجبة" : "إضافة وجبة جديدة"}
      fullOnMobile={true}
      size="lg"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button
            type="submit"
            form="meal-form"
            variant="primary"
            block
            loading={mutation.isPending}
          >
            {meal ? "حفظ التعديلات" : "إضافة الوجبة"}
          </Button>
        </div>
      }
    >
      <form id="meal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* اسم الوجبة */}
        <Input
          label="اسم الوجبة"
          placeholder="مثال: ملوخية بالفراخ"
          error={errors.name?.message}
          {...register("name")}
        />

        {/* الوصف */}
        <Input
          as="textarea"
          label="الوصف (اختياري)"
          placeholder="وصف تفصيلي للوجبة ومكوناتها..."
          error={errors.description?.message}
          className="min-h-[72px]"
          {...register("description")}
        />

        {/* السعر والقسم */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="السعر (جنيه)"
            type="number"
            lang="en"
            min="1"
            placeholder="مثال: 95"
            error={errors.price?.message}
            {...register("price")}
          />

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">
              القسم
            </label>
            <select
              {...register("category")}
              className="min-h-[48px] w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5 text-base font-semibold text-ink transition focus:border-brand-red focus:outline-none"
            >
              {Object.entries(MEAL_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm font-medium text-brand-red">
                {errors.category.message}
              </p>
            )}
          </div>
        </div>

        {/* صورة الوجبة */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">
            صورة الوجبة
          </label>
          <div className="flex flex-wrap items-center gap-4">
            {/* معاينة 100x100 */}
            <div className="relative h-[100px] w-[100px] shrink-0 overflow-hidden rounded-2xl border-2 border-ink/10 bg-cream-dark">
              {image ? (
                <>
                  <img
                    src={image}
                    alt="معاينة"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImageWarning(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    aria-label="حذف الصورة"
                    className="absolute end-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-ink/70 text-white transition hover:bg-brand-red"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <MealPlaceholder className="h-full w-full" />
              )}
            </div>

            {/* زر رفع الصورة */}
            <div className="flex-1 min-w-[200px]">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="meal-image-input"
              />
              <label
                htmlFor="meal-image-input"
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 px-4 py-2.5 text-sm font-bold text-ink transition hover:border-brand-red hover:bg-brand-red/5 active:scale-98"
              >
                <Upload className="h-4 w-4 text-brand-red" />
                <span>{image ? "تغيير الصورة" : "اختر صورة (كاميرا أو ملف)"}</span>
              </label>

              {imageWarning && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <AlertTriangle className="h-4 w-4 text-brand-yellow shrink-0" />
                  <span>حجم الصورة أكبر من 500 كيلوبايت، لكن تم قبولها.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* حالة التوفر للعملاء */}
        <div className="rounded-2xl border border-ink/10 bg-white p-3.5">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div>
              <span className="block font-bold text-ink">
                متاحة للطلب
              </span>
              <span className="block text-xs text-ink-soft">
                تحديد ما إذا كانت الوجبة تظهر للعملاء في القوائم الأسبوعية.
              </span>
            </div>
            <input
              type="checkbox"
              {...register("isAvailable")}
              className="h-6 w-6 rounded-lg accent-brand-red cursor-pointer"
            />
          </label>
        </div>

        {/* ربط الإضافات */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-ink">
            الإضافات المتاحة مع هذه الوجبة:
          </label>
          {addons.length === 0 ? (
            <p className="text-xs text-ink-soft">لا توجد إضافات معرفة بعد.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto rounded-2xl border border-ink/10 bg-white p-3">
              {addons.map((addon) => {
                const checked = selectedAddons.includes(addon.id);
                return (
                  <label
                    key={addon.id}
                    className={cn(
                      "flex min-h-[44px] cursor-pointer items-center justify-between gap-2 rounded-xl border p-2.5 text-sm transition",
                      checked
                        ? "border-brand-red bg-brand-red/5 font-bold"
                        : "border-ink/5 hover:border-ink/20"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAddon(addon.id)}
                        className="h-4 w-4 rounded accent-brand-red"
                      />
                      <span className="text-ink">{addon.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-red">
                      {addon.price === 0 ? "مجاني" : `+${formatPrice(addon.price)}`}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
