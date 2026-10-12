import { forwardRef } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Clock, Plus, Save, Trash2, Truck, Wallet } from "lucide-react";
import { menuApi } from "@/api";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Skeleton from "@/components/common/Skeleton";
import { PageError } from "@/components/admin/PageState";
import { PAYMENT_ICONS } from "@/components/common/PaymentBadges";
import { formatHour, formatHourPhrase } from "@/lib/format";
import { getDayLockTime, getUpcomingDates } from "@/lib/dates";
import { CUTOFF_MODES, DAY_KEYS, DAY_NAMES_AR } from "@/lib/constants";
import { validatePaymentSettings } from "@/lib/payments";
import { newAreaId, validateDeliveryAreas } from "@/lib/delivery";
import { cn } from "@/lib/cn";
import { toast } from "@/store/useToastStore";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const hourLabel = (h) => (h === 0 ? "12 ص (نص الليل)" : h === 12 ? "12 م (الضهر)" : formatHour(h));

// نفس تحقق الـ API (validatePaymentSettings): الطريقة المفعّلة لازم رقمها/عنوانها يبقى صح
const paymentsSchema = z
  .object({
    vodafoneCash: z.object({ enabled: z.boolean(), number: z.string().trim(), accountName: z.string().trim() }),
    instapay: z.object({ enabled: z.boolean(), handle: z.string().trim(), accountName: z.string().trim() }),
    instructions: z.string().trim().max(500, "التعليمات طويلة (500 حرف بالكتير)"),
  })
  .superRefine((payments, ctx) => {
    const errors = validatePaymentSettings(payments);
    if (errors.vodafoneCash) ctx.addIssue({ code: "custom", path: ["vodafoneCash", "number"], message: errors.vodafoneCash });
    if (errors.instapay) ctx.addIssue({ code: "custom", path: ["instapay", "handle"], message: errors.instapay });
  });

// نفس تحقق الـ API (validateDeliveryAreas): غلط كل صف تحت خانته، و"لازم منطقة مفعّلة" على القايمة كلها
const deliveryAreasSchema = z
  .array(z.object({ id: z.string(), name: z.string(), price: z.string(), enabled: z.boolean() }))
  .superRefine((areas, ctx) => {
    const { rows, form } = validateDeliveryAreas(areas);
    for (const [i, row] of Object.entries(rows)) {
      for (const [field, message] of Object.entries(row)) ctx.addIssue({ code: "custom", path: [Number(i), field], message });
    }
    if (form) ctx.addIssue({ code: "custom", path: [], message: form });
  });

const schema = z.object({
  payments: paymentsSchema,
  cutoffMode: z.enum(["same_day", "day_before"]),
  orderCutoffHour: z.number().int().min(0).max(23),
  deliveryAreas: deliveryAreasSchema,
});

const card = "rounded-3xl bg-white p-5 text-ink shadow-soft md:p-6";

const formValues = (s) => ({
  cutoffMode: s.cutoffMode,
  orderCutoffHour: s.orderCutoffHour,
  deliveryAreas: s.deliveryAreas.map((a) => ({ ...a, price: String(a.price) })),
  payments: s.payments,
});

/** مفتاح تشغيل (checkbox حقيقي بـ role="switch"، والسطر كله بيتضغط و ارتفاعه 48px) */
const Switch = forwardRef(function Switch({ label, ...props }, ref) {
  return (
    <label className="flex min-h-[48px] cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-bold">{label}</span>
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className={cn(
          "relative inline-block h-7 w-12 shrink-0 rounded-full bg-ink/20 transition-colors peer-checked:bg-brand-red",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2",
          "after:absolute after:start-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform",
          "peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
        )}
      />
    </label>
  );
});

const LAST_ENABLED = "لازم تفضل منطقة واحدة مفعّلة على الأقل";

/**
 * مناطق التوصيل: اسم + سعر + تشغيل + حذف لكل منطقة، و"إضافة منطقة" بتفتح صف جديد والفوكس على الاسم.
 * إيقاف أو حذف آخر منطقة مفعّلة ممنوع برسالة. موبايل: كل منطقة كارت فوق بعض.
 */
function DeliveryAreasCard({ control, register, setValue, errors }) {
  const { fields, append, remove } = useFieldArray({ control, name: "deliveryAreas", keyName: "key" });
  const areas = useWatch({ control, name: "deliveryAreas" }) || [];
  const enabledCount = areas.filter((a) => a?.enabled).length;
  const isLastEnabled = (i) => !!areas[i]?.enabled && enabledCount === 1;
  const listError = errors.deliveryAreas?.root?.message || errors.deliveryAreas?.message;

  return (
    <section className={card}>
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
        <Truck className="h-5 w-5 shrink-0 text-brand-red" aria-hidden />
        مناطق التوصيل
      </h2>
      <p className="mb-4 text-sm text-ink-soft">الزبون هيختار منطقته وقت الطلب وهيشوف سعر التوصيل بتاعها.</p>

      <ul className="space-y-3">
        {fields.map((field, i) => {
          const rowErrors = errors.deliveryAreas?.[i];
          const areaName = areas[i]?.name?.trim() || `منطقة ${i + 1}`;
          const price = areas[i]?.price;
          return (
            <li key={field.key} className="rounded-2xl border-2 border-ink/10 p-3">
              <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
                <Input
                  label="اسم المنطقة"
                  placeholder="مثال: المعادي"
                  autoComplete="off"
                  error={rowErrors?.name?.message}
                  {...register(`deliveryAreas.${i}.name`)}
                />
                <Input
                  label="السعر (جنيه)"
                  type="number"
                  lang="en"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  dir="ltr"
                  className="text-end"
                  error={rowErrors?.price?.message}
                  hint={price !== "" && Number(price) === 0 ? "توصيل مجاني" : undefined}
                  {...register(`deliveryAreas.${i}.price`)}
                />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Switch
                    label={<>مفعّلة<span className="sr-only"> — {areaName}</span></>}
                    {...register(`deliveryAreas.${i}.enabled`, {
                      // آخر منطقة مفعّلة: نرجّع المفتاح زي ما كان (areas هنا قيم ما قبل الضغطة)
                      onChange: (e) => {
                        if (e.target.checked || !isLastEnabled(i)) return;
                        setValue(`deliveryAreas.${i}.enabled`, true);
                        toast.error(LAST_ENABLED);
                      },
                    })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => (isLastEnabled(i) ? toast.error(LAST_ENABLED) : remove(i))}
                  aria-label={`حذف ${areaName}`}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
                >
                  <Trash2 className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {listError && <p role="alert" className="mt-3 text-sm font-semibold text-brand-red">{listError}</p>}

      <Button
        type="button"
        variant="outline"
        block
        className="mt-4"
        onClick={() => append({ id: newAreaId(), name: "", price: "", enabled: true }, { focusName: `deliveryAreas.${fields.length}.name` })}
      >
        <Plus className="h-5 w-5" aria-hidden />
        إضافة منطقة
      </Button>
    </section>
  );
}

/** "الزبون هيشوف: ..." للطريقة المفعّلة اللي ليها رقم، بالأرقام في اتجاهها (LTR) والسطر على البداية */
const customerSees = (enabled, value) =>
  enabled && value?.trim() ? <>الزبون هيشوف: <bdi dir="ltr">{value.trim()}</bdi></> : undefined;

function SettingsForm({ settings }) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: formValues(settings),
  });
  const vodafone = watch("payments.vodafoneCash");
  const instapay = watch("payments.instapay");

  const cutoffMode = watch("cutoffMode");
  const cutoffHour = Number(watch("orderCutoffHour"));
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
      reset(formValues(saved));
      toast.success("تم حفظ الإعدادات");
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة أثناء الحفظ"),
  });

  return (
    <form noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))} className="max-w-2xl space-y-5 lg:max-w-none">
      {/* من 1024px: عمودين (القفل + مناطق التوصيل | طرق الدفع). أقل من كده عمود واحد بنفس الترتيب */}
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0 space-y-5">
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

          <DeliveryAreasCard control={control} register={register} setValue={setValue} errors={errors} />
        </div>

        <div className="min-w-0">
          <section className={card}>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
              <Wallet className="h-5 w-5 shrink-0 text-brand-red" aria-hidden />
              طرق الدفع
            </h2>
            <p className="mb-4 text-sm text-ink-soft">الزبون بيشوف بس الطرق المفعّلة واللي رقمها مكتوب صح. التحويل بيتأكد بصورة إيصال بتراجعها من صفحة الطلب.</p>

            <div className="space-y-4">
              <div className="flex min-h-[48px] items-center gap-3 rounded-2xl bg-cream px-4 py-2">
                <PAYMENT_ICONS.cash className="h-5 w-5 shrink-0 text-ink" aria-hidden />
                <p className="min-w-0 flex-1 text-sm font-bold">كاش عند الاستلام</p>
                <span className="shrink-0 text-xs font-semibold text-ink-soft">متاح دايماً</span>
              </div>

              <fieldset className="rounded-2xl border-2 border-ink/10 p-4">
                <legend className="flex items-center gap-2 px-1 text-sm font-extrabold">
                  <PAYMENT_ICONS.vodafone_cash className="h-[18px] w-[18px] shrink-0 text-brand-red" aria-hidden />
                  فودافون كاش
                </legend>
                <Switch label="تفعيل فودافون كاش" {...register("payments.vodafoneCash.enabled")} />
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Input
                    label="رقم المحفظة"
                    inputMode="tel"
                    dir="ltr"
                    autoComplete="off"
                    placeholder="01XXXXXXXXX"
                    error={errors.payments?.vodafoneCash?.number?.message}
                    hint={customerSees(vodafone?.enabled, vodafone?.number)}
                    {...register("payments.vodafoneCash.number")}
                  />
                  <Input
                    label="اسم صاحب المحفظة (اختياري)"
                    autoComplete="off"
                    {...register("payments.vodafoneCash.accountName")}
                  />
                </div>
              </fieldset>

              <fieldset className="rounded-2xl border-2 border-ink/10 p-4">
                <legend className="flex items-center gap-2 px-1 text-sm font-extrabold">
                  <PAYMENT_ICONS.instapay className="h-[18px] w-[18px] shrink-0 text-brand-red" aria-hidden />
                  إنستاباي
                </legend>
                <Switch label="تفعيل إنستاباي" {...register("payments.instapay.enabled")} />
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <Input
                    label="رقم أو عنوان إنستاباي"
                    dir="ltr"
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="01XXXXXXXXX أو name@instapay"
                    error={errors.payments?.instapay?.handle?.message}
                    hint={customerSees(instapay?.enabled, instapay?.handle)}
                    {...register("payments.instapay.handle")}
                  />
                  <Input
                    label="اسم صاحب الحساب (اختياري)"
                    autoComplete="off"
                    {...register("payments.instapay.accountName")}
                  />
                </div>
              </fieldset>

              <Input
                as="textarea"
                label="تعليمات للزبون (اختياري)"
                placeholder="مثال: اكتب رقم الطلب في ملاحظة التحويل"
                maxLength={500}
                error={errors.payments?.instructions?.message}
                hint="بتظهر للزبون في صفحة التحويل."
                {...register("payments.instructions")}
              />
            </div>
          </section>
        </div>
      </div>

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
        <p className="mt-1 text-sm text-ink-soft">ميعاد قفل الطلبات ومناطق التوصيل وطرق الدفع — بيتطبقوا على صفحة الزبون على طول.</p>
      </div>

      {isLoading ? (
        <div className="max-w-2xl space-y-5 lg:max-w-none" aria-busy="true">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-5">
              <Skeleton className="h-56 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
            <Skeleton className="h-96 rounded-3xl" />
          </div>
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
