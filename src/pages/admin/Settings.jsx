import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Clock, Save, Truck } from "lucide-react";
import { menuApi } from "@/api";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Skeleton from "@/components/common/Skeleton";
import { PageError } from "@/components/admin/PageState";
import { formatHour, formatHourPhrase, formatPrice } from "@/lib/format";
import { getDayLockTime, getUpcomingDates } from "@/lib/dates";
import { CUTOFF_MODES, DAY_KEYS, DAY_NAMES_AR } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h) => (h === 0 ? "12 ص (نص الليل)" : h === 12 ? "12 م (الضهر)" : formatHour(h));

const schema = z.object({
  cutoffMode: z.enum(["same_day", "day_before"]),
  orderCutoffHour: z.number().int().min(0).max(23),
  deliveryFee: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number({ error: "رسوم التوصيل مطلوبة (اكتب 0 لو التوصيل مجاني)" }).min(0, "الرسوم مينفعش تكون أقل من 0")
  ),
});

const card = "rounded-3xl bg-white p-5 text-ink shadow-soft md:p-6";

function SettingsForm({ settings }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { cutoffMode: settings.cutoffMode, orderCutoffHour: settings.orderCutoffHour, deliveryFee: String(settings.deliveryFee) },
  });

  const cutoffMode = watch("cutoffMode");
  const cutoffHour = Number(watch("orderCutoffHour"));
  const fee = watch("deliveryFee");
  // مثال لايف بنفس حساب القفل اللي عند الزبون: طلبات بكره بتقفل إمتى بالإعدادات اللي على الشاشة
  const example = getUpcomingDates(1)[0];
  const exampleLock = getDayLockTime(example.date, { cutoffMode, orderCutoffHour: cutoffHour });
  const exampleLockDay = DAY_NAMES_AR[DAY_KEYS[exampleLock.getDay()]];
  const sameDay = cutoffMode === "same_day";

  const mutation = useMutation({
    mutationFn: (data) => menuApi.saveSettings(data),
    onSuccess: (res, data) => {
      const saved = res ?? { ...settings, ...data };
      queryClient.setQueryData(["settings"], saved);
      // قفل الأيام عند الزبون بيتحسب من الإعدادات
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      reset({ cutoffMode: saved.cutoffMode, orderCutoffHour: saved.orderCutoffHour, deliveryFee: String(saved.deliveryFee) });
      toast.success("تم حفظ الإعدادات");
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة أثناء الحفظ"),
  });

  return (
    <form noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))} className="max-w-2xl space-y-5">
      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
          <Clock className="h-5 w-5 shrink-0 text-brand-red" aria-hidden />
          ميعاد قفل الطلبات
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          {sameDay ? "آخر ساعة الزبون يقدر يطلب فيها لنفس اليوم." : "آخر ساعة الزبون يقدر يطلب فيها لليوم اللي بعده."}
        </p>

        <fieldset className="mb-4">
          <legend className="mb-1.5 block text-sm font-semibold">اليوم بيتقفل في</legend>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-cream-dark p-1">
            {Object.entries(CUTOFF_MODES).map(([value, label]) => (
              <label key={value} className="relative">
                <input type="radio" value={value} className="peer sr-only" {...register("cutoffMode")} />
                <span
                  className={cn(
                    "flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl px-3 text-center text-sm font-bold transition",
                    "text-ink-soft hover:text-ink peer-checked:bg-brand-red peer-checked:text-white peer-checked:shadow-sm",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-cream-dark"
                  )}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label htmlFor="orderCutoffHour" className="mb-1.5 block text-sm font-semibold">الساعة</label>
        <div className="relative">
          <select
            id="orderCutoffHour"
            className="min-h-[48px] w-full cursor-pointer appearance-none rounded-2xl border-2 border-ink/10 bg-white pe-11 ps-4 text-base font-semibold text-ink transition focus:border-brand-red focus:outline-none"
            {...register("orderCutoffHour", { setValueAs: Number })}
          >
            {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden />
        </div>
        <p aria-live="polite" className="mt-3 rounded-2xl bg-brand-yellow-soft px-4 py-3 text-sm font-semibold text-ink">
          كل يوم بيتقفل الساعة {formatHour(cutoffHour)} {sameDay ? "في نفس اليوم" : "في اليوم اللي قبله"}.
          <span className="mt-0.5 block font-normal text-ink-soft">
            مثال: طلبات يوم {example.dayName} بتقفل {exampleLockDay} الساعة {formatHourPhrase(cutoffHour)}.
          </span>
        </p>
      </section>

      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
          <Truck className="h-5 w-5 shrink-0 text-brand-red" aria-hidden />
          التوصيل
        </h2>
        <p className="mb-4 text-sm text-ink-soft">بتتضاف مرة واحدة على إجمالي كل طلب.</p>
        <Input
          label="رسوم التوصيل (جنيه)"
          type="number"
          lang="en"
          inputMode="decimal"
          min="0"
          step="any"
          dir="ltr"
          className="text-end"
          error={errors.deliveryFee?.message}
          hint={fee !== "" && Number(fee) === 0 ? "التوصيل هيبقى مجاني" : `الزبون هيشوف: التوصيل ${formatPrice(fee)}`}
          {...register("deliveryFee")}
        />
      </section>

      <div className="flex flex-col-reverse gap-3 pb-safe sm:flex-row sm:items-center">
        <Button type="submit" loading={mutation.isPending} disabled={!isDirty} className="w-full sm:w-auto">
          <Save className="h-5 w-5" aria-hidden />
          حفظ الإعدادات
        </Button>
        {isDirty && <p className="text-sm font-semibold text-ink-soft">فيه تعديلات لسه ما اتحفظتش</p>}
      </div>
    </form>
  );
}

export default function Settings() {
  const { data: settings, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: menuApi.getSettings,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">الإعدادات</h1>
        <p className="mt-1 text-sm text-ink-soft">ميعاد قفل الطلبات ورسوم التوصيل — بيتطبقوا على صفحة الزبون على طول.</p>
      </div>

      {isLoading ? (
        <div className="max-w-2xl space-y-5" aria-busy="true">
          <Skeleton className="h-56 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-12 w-44 rounded-full" />
        </div>
      ) : isError ? (
        <PageError title="تعذر تحميل الإعدادات" error={error} onRetry={refetch} />
      ) : (
        <SettingsForm settings={settings} />
      )}
    </div>
  );
}
