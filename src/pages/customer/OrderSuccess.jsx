import { useEffect, useRef, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import OrderSummary from "@/components/customer/OrderSummary";
import { LogoIcon } from "@/components/common/Logo";
import { whatsappUrl } from "@/lib/whatsapp";
import { ORDER_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { isElectronicPayment } from "@/lib/payments";
import { PAYMENT_ICONS, PaymentStatusBadge } from "@/components/common/PaymentBadges";
import { CircleCheckBig, MapPin, MessageCircle, Phone, StickyNote, User } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brandColors";

/** سطر في بيانات التوصيل: أيقونة + كلام، كله على البداية (يمين في RTL) بنفس المسافة */
function DetailRow({ icon: Icon, label, children }) {
  return (
    <li className="flex items-start gap-2.5">
      {/* mt بسيط: الأيقونة (18px) في نص أول سطر (20px) حتى لو العنوان نزل سطرين */}
      <Icon className="mt-px h-[18px] w-[18px] shrink-0 text-ink" aria-hidden />
      <span className="sr-only">{label}: </span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </li>
  );
}

export default function OrderSuccess() {
  const { id } = useParams();
  const confettiDone = useRef(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id),
    retry: 1,
  });

  // Confetti 🎉
  useEffect(() => {
    if (!order || confettiDone.current) return;
    // Skip confetti for prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confettiDone.current = true;
    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      // Red & Yellow confetti burst
      const colors = [BRAND_COLORS.red, BRAND_COLORS.yellow, BRAND_COLORS.redDark, BRAND_COLORS.yellowSoft];
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
      setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { y: 0.5 }, colors }), 300);
    }).catch(() => { /* الكونفيتي ديكور بس — لو الملف ما اتحمّلش الصفحة كاملة عادي */ });
  }, [order]);

  // WhatsApp link
  const waUrl = useMemo(() => {
    if (!order) return "#";
    return whatsappUrl({
      items: order.items,
      customer: order.customer,
      deliveryFee: order.deliveryFee,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
    });
  }, [order]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <Skeleton className="mx-auto h-20 w-20 rounded-full" />
        <Skeleton className="h-10 w-3/4 mx-auto" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto grid max-w-md place-items-center px-4 py-20 text-center">
        <LogoIcon tone="onLight" className="mb-4 w-24" />
        <h1 className="text-2xl font-extrabold">الطلب مش موجود</h1>
        <p className="mb-6 mt-2 text-ink-soft">يمكن اللينك غلط أو الطلب اتمسح.</p>
        <Button as={Link} to="/">الرئيسية</Button>
      </div>
    );
  }

  const statusInfo = ORDER_STATUS[order.status] || { label: order.status };
  // التحويل: سطر الدفع في بيانات التوصيل (الصورة اترفعت مع الطلب). الكاش زي ما هو
  const electronic = isElectronicPayment(order.paymentMethod);

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      {/* أيقونة النجاح واللوجو */}
      <div className="mx-auto mb-6 flex flex-col items-center gap-3">
        <LogoIcon tone="onLight" className="w-20" />
        <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-red/10 ring-8 ring-brand-red/5">
          <CircleCheckBig className="h-11 w-11 text-brand-red" aria-hidden />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold">تم تأكيد طلبك!</h1>
      <p className="mt-2 text-lg text-ink-soft">شكراً ليك، طلبك رقم <strong>#{order.orderNumber}</strong> وصلنا.</p>

      {/* الحالة */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-yellow-soft px-5 py-2 font-bold text-ink">
        الحالة: {statusInfo.label}
      </div>

      {/* ملخص الطلب */}
      <div className="mt-6 text-start">
        <OrderSummary items={order.items} deliveryFee={order.deliveryFee} />
      </div>

      {/* بيانات العميل */}
      <div className="mt-4 rounded-3xl bg-white p-5 text-start shadow-soft">
        <h3 className="mb-3 font-bold">بيانات التوصيل</h3>
        <ul className="space-y-2.5 text-sm text-ink-soft">
          <DetailRow icon={User} label="الاسم">{order.customer.name}</DetailRow>
          {/* الأرقام بترتيبها LTR جوه <bdi>، والسطر نفسه على البداية زي الباقي */}
          <DetailRow icon={Phone} label="الموبايل"><bdi dir="ltr">{order.customer.phone}</bdi></DetailRow>
          <DetailRow icon={MapPin} label="العنوان">{order.customer.address}</DetailRow>
          {order.customer.notes && <DetailRow icon={StickyNote} label="ملاحظات">{order.customer.notes}</DetailRow>}
          {electronic && (
            <DetailRow icon={PAYMENT_ICONS[order.paymentMethod]} label="الدفع">
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                {PAYMENT_METHODS[order.paymentMethod].label}
                <PaymentStatusBadge status={order.payment.status} short className="px-2.5 py-0.5" />
              </span>
            </DetailRow>
          )}
        </ul>
      </div>

      {/* أزرار */}
      <div className="mt-6 space-y-3 pb-safe">
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
        <Button as={Link} to="/" variant="outline" block>
          اطلب تاني
        </Button>
      </div>
    </div>
  );
}
