import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi, menuApi } from "@/api";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import OrderSummary from "@/components/customer/OrderSummary";
import LockedDaysModal from "@/components/customer/LockedDaysModal";
import ProofUploader from "@/components/customer/ProofUploader";
import CopyButton from "@/components/common/CopyButton";
import { PAYMENT_ICONS } from "@/components/common/PaymentBadges";
import { PAYMENT_METHODS, PHONE_REGEX } from "@/lib/constants";
import { availablePaymentMethods, isElectronicPayment, paymentDestination } from "@/lib/payments";
import { areaOptionLabel, enabledAreas, findEnabledArea } from "@/lib/delivery";
import { formatDayLabel, getLockedDates } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { cartSubtotal } from "@/lib/cart";
import { ChevronDown, CircleCheck, MessageCircle, ReceiptText } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/cn";

const schema = z.object({
  name: z.string().min(2, "الاسم لازم يكون حرفين على الأقل"),
  phone: z.string().regex(PHONE_REGEX, "رقم الموبايل مش صح (مثال: 01012345678)"),
  deliveryAreaId: z.string().min(1, "اختار العنوان"),
  address: z.string().min(3, "اكتب تفاصيل العنوان"),
  notes: z.string().optional(),
  paymentMethod: z.enum(["cash", "vodafone_cash", "instapay"]),
});

/** سطر توضيحي تحت كل طريقة دفع */
const PAYMENT_HINTS = {
  cash: "تدفع للمندوب لما الأكل يوصلك",
  vodafone_cash: "هتحوّل على رقمنا وترفع صورة التحويل",
  instapay: "هتحوّل على حسابنا وترفع صورة التحويل",
};

const PROOF_REQUIRED = "ارفع صورة التحويل عشان تكمّل";
const AREA_UNAVAILABLE = "العنوان اللي كنت مختاره مبقاش متاح. اختار العنوان من جديد.";

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const saveCustomer = useCartStore((s) => s.saveCustomer);
  const clearCart = useCartStore((s) => s.clearCart);
  const savedPaymentMethod = useCartStore((s) => s.paymentMethod);
  const savePaymentMethod = useCartStore((s) => s.savePaymentMethod);

  // لو السلة فاضية روح للرئيسية (إلا لو السلة اتفضت لأن الطلب اتأكد => صفحة النجاح)
  const orderPlaced = useRef(false);
  useEffect(() => {
    if (items.length === 0 && !orderPlaced.current) navigate("/", { replace: true });
  }, [items.length, navigate]);

  // جيب الإعدادات (مناطق التوصيل وميعاد القفل وطرق الدفع)
  const queryClient = useQueryClient();
  const settingsQuery = { queryKey: ["settings"], queryFn: menuApi.getSettings, staleTime: 0 }; // الأدمن ممكن يكون غيّرها
  const { data: settings } = useQuery(settingsQuery);

  // أيام في السلة اتقفلت: بنعرضها أول ما الصفحة تفتح، ونتحقق تاني لحظة التأكيد
  const itemDates = items.map((it) => it.date);
  const lockedDates = settings ? getLockedDates(itemDates, settings) : [];
  const [lockedOpen, setLockedOpen] = useState(false);
  const lockedOnLoad = lockedDates.length > 0;
  useEffect(() => { if (lockedOnLoad) setLockedOpen(true); }, [lockedOnLoad]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name || "",
      phone: customer.phone || "",
      deliveryAreaId: customer.deliveryAreaId || "",
      address: customer.address || "",
      notes: customer.notes || "",
      paymentMethod: savedPaymentMethod || "cash",
    },
  });

  const formValues = watch();

  // طرق الدفع المتاحة من الإعدادات (الكاش دايماً). لو الطريقة المحفوظة اتقفلت نرجع للكاش
  const methods = settings ? availablePaymentMethods(settings) : ["cash"];
  const selectedMethod = formValues.paymentMethod;
  const methodsKey = methods.join();
  useEffect(() => {
    if (settings && !methodsKey.split(",").includes(selectedMethod)) setValue("paymentMethod", "cash");
  }, [settings, methodsKey, selectedMethod, setValue]);
  const electronic = isElectronicPayment(selectedMethod);
  const destination = electronic ? paymentDestination(selectedMethod, settings) : null;

  // مناطق التوصيل المفعّلة (لو واحدة بس بتتختار لوحدها). المنطقة المحفوظة من طلب قبل كده
  // لازم تكون لسه موجودة ومفعّلة، وإلا بتتمسح ونطلب منه يختار تاني. رسوم التوصيل = سعر المنطقة المختارة
  const areas = enabledAreas(settings);
  const selectedAreaId = formValues.deliveryAreaId;
  const selectedArea = findEnabledArea(settings, selectedAreaId);
  const deliveryFee = selectedArea ? selectedArea.price : null; // null = لسه ما اختارش
  const [areaNotice, setAreaNotice] = useState(null);
  const areaIds = areas.map((a) => a.id).join();
  useEffect(() => {
    if (!settings) return;
    const ids = areaIds ? areaIds.split(",") : [];
    if (selectedAreaId && ids.includes(selectedAreaId)) return;
    if (ids.length === 1) {
      setValue("deliveryAreaId", ids[0], { shouldValidate: true });
      setAreaNotice(null);
    } else if (selectedAreaId) {
      setValue("deliveryAreaId", "");
      setAreaNotice(AREA_UNAVAILABLE);
    }
  }, [settings, areaIds, selectedAreaId, setValue]);
  const areaError = errors.deliveryAreaId?.message || areaNotice;

  // صورة التحويل (فودافون كاش/إنستاباي): إجبارية قبل التأكيد وبتتبعت مع الطلب نفسه.
  // تغيير طريقة الدفع بيمسحها: الصورة بتاعة تحويل على طريقة معينة، ومتنفعش لطريقة تانية ولا للكاش.
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState(null);
  const proofRef = useRef(null);
  useEffect(() => {
    setProofFile(null);
    setProofError(null);
  }, [selectedMethod]);

  const mutation = useMutation({
    mutationFn: ({ data, proof }) =>
      ordersApi.create({
        customer: { name: data.name, phone: data.phone, address: data.address, notes: data.notes },
        items,
        deliveryAreaId: data.deliveryAreaId,
        paymentMethod: data.paymentMethod,
      }, proof),
    onSuccess: (order) => {
      orderPlaced.current = true;
      haptic([12, 60, 18]);
      saveCustomer({
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        notes: order.customer.notes,
        deliveryAreaId: order.deliveryArea?.id || "",
      });
      savePaymentMethod(order.paymentMethod);
      clearCart();
      if (isElectronicPayment(order.paymentMethod)) toast.success("وصل الإيصال");
      // replace: الرجوع ما يفتحش فورم الطلب تاني
      navigate(`/order-success/${order.id}`, { replace: true });
    },
    onError: (e) => {
      toast.error(e.message || "حصلت مشكلة، حاول تاني");
      // ممكن الأدمن قفل طريقة دفع => نجيب الإعدادات من جديد عشان الاختيارات تتحدث
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  // تحويل من غير صورة => رسالة تحت مكان الرفع ونوديه عنده
  const proofMissing = () => {
    if (!electronic || proofFile) return false;
    setProofError(PROOF_REQUIRED);
    proofRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  };

  // ضغطتين ورا بعض ما يعملوش طلبين (الزرار بيتقفل بعد التحقق، والـ ref بيغطي وقت التحقق نفسه)
  const submitting = useRef(false);
  const onSubmit = async (data) => {
    if (submitting.current || mutation.isPending || proofMissing()) return;
    submitting.current = true;
    // تحقق إن كل الأيام لسه مفتوحة قبل الإرسال مباشرة (بإعدادات جديدة من السيرفر والوقت الحالي)
    try {
      const latest = await queryClient.fetchQuery(settingsQuery);
      const closed = getLockedDates(itemDates, latest);
      if (closed.length > 0) {
        toast.error(`الطلب اتقفل على ${closed.map(formatDayLabel).join("، ")}. شيل وجباته وكمّل.`);
        setLockedOpen(true);
        return;
      }
      // المنطقة اتقفلت أو اتمسحت من الإعدادات وهو في الصفحة => ما نبعتش، ويختار تاني
      if (!findEnabledArea(latest, data.deliveryAreaId)) {
        setValue("deliveryAreaId", "");
        setAreaNotice(AREA_UNAVAILABLE);
        setFocus("deliveryAreaId");
        return;
      }
      mutation.mutate({ data, proof: electronic ? proofFile : null });
    } catch {
      toast.error("حصلت مشكلة أثناء التحقق، حاول تاني.");
    } finally {
      submitting.current = false;
    }
  };

  // البيانات فيها غلط: الفورم بيوري أخطاءه، ونوري كمان لو صورة التحويل ناقصة
  const onInvalid = () => {
    if (electronic && !proofFile) setProofError(PROOF_REQUIRED);
  };

  // WhatsApp link
  const waUrl = useMemo(() => {
    if (items.length === 0) return "#";
    return whatsappUrl({
      items,
      customer: {
        name: formValues.name || customer.name || "—",
        phone: formValues.phone || customer.phone || "—",
        address: formValues.address || customer.address || "—",
        notes: formValues.notes || customer.notes,
      },
      deliveryFee,
      deliveryAreaName: selectedArea?.name,
      paymentMethod: selectedMethod,
    });
  }, [items, formValues.name, formValues.phone, formValues.address, formValues.notes, customer, deliveryFee, selectedArea?.name, selectedMethod]);

  const total = cartSubtotal(items) + (deliveryFee ?? 0);

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold md:text-3xl">إتمام الطلب</h1>

      <div className="gap-8 lg:grid lg:grid-cols-[1fr_380px]">
        {/* ═══ الملخص (موبايل: collapsible فوق الفورم) ═══ */}
        <div className="mb-6 lg:order-2 lg:mb-0">
          <div className="lg:sticky lg:top-24">
            <div className="lg:hidden">
              <OrderSummary items={items} deliveryFee={deliveryFee} areaName={selectedArea?.name} collapsible />
            </div>
            <div className="hidden lg:block">
              <OrderSummary items={items} deliveryFee={deliveryFee} areaName={selectedArea?.name} />
            </div>
          </div>
        </div>

        {/* ═══ الفورم ═══ */}
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          className="space-y-5 lg:order-1"
        >
          <div className="rounded-3xl bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-xl font-bold">بياناتك</h2>
            <div className="space-y-4">
              <Input
                label="الاسم"
                placeholder="اسمك الكامل"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="رقم الموبايل"
                placeholder="01012345678"
                inputMode="tel"
                dir="ltr"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <div>
                <label htmlFor="deliveryAreaId" className="mb-1.5 block text-sm font-semibold">العنوان</label>
                {settings ? (
                  <div className="relative">
                    <select
                      id="deliveryAreaId"
                      aria-invalid={!!areaError}
                      aria-describedby={areaError ? "deliveryAreaId-err" : undefined}
                      className={cn(
                        "min-h-[48px] w-full cursor-pointer appearance-none rounded-2xl border-2 bg-white pe-11 ps-4 text-base transition focus:border-brand-red focus:outline-none",
                        areaError ? "border-brand-red" : "border-ink/10",
                        selectedArea ? "text-ink" : "text-ink-soft"
                      )}
                      {...register("deliveryAreaId", { onChange: () => setAreaNotice(null) })}
                    >
                      <option value="" disabled className="text-ink-soft">اختار العنوان</option>
                      {areas.map((a) => <option key={a.id} value={a.id} className="text-ink">{areaOptionLabel(a)}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden />
                  </div>
                ) : (
                  <div className="min-h-[48px] animate-pulse rounded-2xl border-2 border-ink/10 bg-cream" aria-busy="true" />
                )}
                {areaError && <p id="deliveryAreaId-err" role="alert" className="mt-1 text-sm font-medium text-brand-red">{areaError}</p>}
              </div>
              <Input
                label="تفاصيل العنوان"
                placeholder="الشارع، رقم العمارة، الدور، أقرب علامة مميزة"
                error={errors.address?.message}
                {...register("address")}
              />
              <Input
                as="textarea"
                label="ملاحظات (اختياري)"
                placeholder="أي تعليمات إضافية..."
                {...register("notes")}
              />
            </div>
          </div>

          {/* طريقة الدفع: radio group حقيقي (الأسهم بتتنقل بين الاختيارات) */}
          <fieldset className="rounded-3xl bg-white p-5 shadow-soft">
            <legend className="sr-only">طريقة الدفع</legend>
            <h2 aria-hidden className="mb-3 text-xl font-bold">الدفع</h2>
            <div className="space-y-2.5">
              {methods.map((m) => {
                const Icon = PAYMENT_ICONS[m];
                const checked = selectedMethod === m;
                return (
                  <label key={m} className="relative block cursor-pointer">
                    <input type="radio" value={m} className="peer sr-only" {...register("paymentMethod")} />
                    <span
                      className={cn(
                        "flex min-h-[64px] items-center gap-3 rounded-2xl border-2 p-3 transition",
                        "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2",
                        checked ? "border-brand-red bg-brand-red/5" : "border-ink/10 bg-white hover:border-brand-red/40"
                      )}
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", checked ? "bg-brand-red text-white" : "bg-cream text-ink")}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold">{PAYMENT_METHODS[m].label}</span>
                        <span className="block text-sm text-ink-soft">{PAYMENT_HINTS[m]}</span>
                      </span>
                      <CircleCheck className={cn("h-6 w-6 shrink-0 transition", checked ? "text-brand-red" : "text-ink/15")} aria-hidden />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* التحويل: المبلغ + الرقم + صورة التحويل (إجبارية قبل التأكيد) */}
          {electronic && (
            <section className="space-y-4 rounded-3xl bg-white p-5 shadow-soft" aria-labelledby="transfer-title">
              <h2 id="transfer-title" className="text-xl font-bold">حوّل المبلغ وارفع صورة التحويل</h2>

              {/* المبلغ شامل توصيل المنطقة، فمش بيظهر غير بعد ما يختارها */}
              {selectedArea ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0">
                    <span className="block text-xs font-semibold text-ink-soft">المبلغ اللي هتحوّله</span>
                    <span className="block text-2xl font-black text-brand-red">{formatPrice(total)}</span>
                  </p>
                  <CopyButton value={String(total)} label="نسخ المبلغ" successMessage="اتنسخ المبلغ" />
                </div>
              ) : (
                <p className="rounded-2xl bg-brand-yellow-soft p-3 text-sm font-semibold text-ink">
                  اختار العنوان الأول عشان يظهر المبلغ اللي هتحوّله (شامل التوصيل).
                </p>
              )}

              {destination?.value && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream p-3">
                    <p className="min-w-0">
                      <span className="block text-xs font-semibold text-ink-soft">
                        {selectedMethod === "vodafone_cash" ? "رقم المحفظة" : "رقم أو عنوان إنستاباي"}
                      </span>
                      <bdi dir="ltr" className="block text-xl font-extrabold [overflow-wrap:anywhere]">{destination.value}</bdi>
                    </p>
                    <CopyButton value={destination.value} successMessage="اتنسخ الرقم" />
                  </div>
                  {destination.accountName && (
                    <p className="mt-2 text-sm text-ink-soft">باسم: <strong className="text-ink">{destination.accountName}</strong></p>
                  )}
                </div>
              )}

              {settings?.payments?.instructions && (
                <p className="flex items-start gap-2 rounded-2xl border-2 border-ink/10 p-3 text-sm text-ink [overflow-wrap:anywhere]">
                  <ReceiptText className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-red" aria-hidden />
                  {settings.payments.instructions}
                </p>
              )}

              <p className="text-sm text-ink-soft">حوّل المبلغ بالظبط، وخد سكرين شوت لرسالة نجاح التحويل وارفعها هنا قبل ما تأكّد الطلب.</p>

              <div ref={proofRef} className="scroll-mt-24">
                <ProofUploader
                  file={proofFile}
                  onChange={(f) => { setProofFile(f); setProofError(null); }}
                  error={proofError}
                  disabled={mutation.isPending}
                />
              </div>
            </section>
          )}

          {/* الإجمالي وأزرار */}
          <div className="space-y-3 pb-safe">
            <div className="rounded-3xl bg-brand-red px-5 py-4 text-white">
              <div className="flex items-center justify-between text-lg font-extrabold">
                <span>الإجمالي</span>
                <span>{formatPrice(total)}</span>
              </div>
              {!selectedArea && <p className="mt-0.5 text-sm text-white/85">التوصيل هيتضاف لما تختار العنوان</p>}
            </div>

            <Button type="submit" block size="lg" loading={mutation.isPending} disabled={!settings}>
              أكّد الطلب
            </Button>

            <Button
              as="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              block
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              ابعت الطلب على واتساب
            </Button>
          </div>
        </form>
      </div>

      <LockedDaysModal open={lockedOpen} dates={lockedDates} onClose={() => setLockedOpen(false)} />
    </div>
  );
}
