import { useEffect, useRef, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, WHATSAPP_NUMBER } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import OrderSummary from "@/components/customer/OrderSummary";
import { LogoIcon } from "@/components/common/Logo";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import { MessageCircle, PartyPopper } from "lucide-react";

export default function OrderSuccess() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      const colors = ["#ED1C24", "#FFDE17", "#C4141B", "#FFF3A6"];
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors });
      setTimeout(() => confetti({ particleCount: 50, spread: 90, origin: { y: 0.5 }, colors }), 300);
    });
  }, [order]);

  // WhatsApp link
  const waUrl = useMemo(() => {
    if (!order) return "#";
    return buildWhatsAppUrl(WHATSAPP_NUMBER, {
      items: order.items,
      customer: order.customer,
      deliveryFee: order.deliveryFee,
      orderNumber: order.orderNumber,
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

  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      {/* أيقونة النجاح */}
      <div className="mx-auto mb-6 grid h-24 w-24 place-items-center rounded-full bg-brand-red shadow-pop">
        <PartyPopper className="h-12 w-12 text-brand-yellow" aria-hidden />
      </div>

      <h1 className="text-3xl font-extrabold">تم تأكيد طلبك! 🎉</h1>
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
        <h3 className="mb-2 font-bold">بيانات التوصيل</h3>
        <p className="text-sm text-ink-soft">👤 {order.customer.name}</p>
        <p className="text-sm text-ink-soft" dir="ltr">📞 {order.customer.phone}</p>
        <p className="text-sm text-ink-soft">📍 {order.customer.address}</p>
        {order.customer.notes && <p className="text-sm text-ink-soft">📝 {order.customer.notes}</p>}
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
          تواصل عن طريق واتساب
        </Button>
        <Button as={Link} to="/" variant="outline" block>
          اطلب تاني
        </Button>
      </div>
    </div>
  );
}
