import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ImageOff, ZoomIn } from "lucide-react";
import { menuApi, ordersApi } from "@/api";
import Skeleton from "@/components/common/Skeleton";
import { PaymentMethodLabel, PaymentStatusBadge } from "@/components/common/PaymentBadges";
import ProofLightbox from "./ProofLightbox";
import { formatDateTime, formatPrice } from "@/lib/format";
import { isElectronicPayment, paymentDestination } from "@/lib/payments";

const card = "rounded-3xl bg-white p-5 text-ink shadow-soft";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className="min-w-0 text-end font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/**
 * كارت "الدفع" في تفاصيل الطلب (أدمن) — عرض بس، مفيش موافقة أو رفض:
 * الأدمن بيشوف صورة التحويل ويتأكد بنفسه من المبلغ والرقم.
 */
export default function PaymentCard({ order }) {
  const electronic = isElectronicPayment(order.paymentMethod);
  const { status, proofUploadedAt } = order.payment;
  const hasProof = electronic && !!proofUploadedAt;

  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: menuApi.getSettings, enabled: electronic });
  const destination = electronic ? paymentDestination(order.paymentMethod, settings)?.value : "";
  const proof = useQuery({
    queryKey: ["paymentProof", order.id, proofUploadedAt],
    queryFn: () => ordersApi.getPaymentProof(order.id),
    enabled: hasProof,
    staleTime: Infinity,
  });
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <section className={card} aria-labelledby={`payment-${order.id}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={`payment-${order.id}`} className="text-lg font-extrabold">الدفع</h2>
        <PaymentStatusBadge status={status} />
      </div>
      <PaymentMethodLabel method={order.paymentMethod} className="mb-3 text-sm font-semibold" />

      {!electronic ? (
        <dl className="space-y-2">
          <Row label="المطلوب تحصيله">{formatPrice(order.totalPrice)}</Row>
        </dl>
      ) : (
        <div className="space-y-4">
          <dl className="space-y-2">
            <Row label="المبلغ المطلوب تحويله">{formatPrice(order.totalPrice)}</Row>
            <Row label="التحويل على"><bdi dir="ltr">{destination || "—"}</bdi></Row>
            {proofUploadedAt && <Row label="وقت رفع الإيصال">{formatDateTime(proofUploadedAt)}</Row>}
          </dl>

          {/* طلب قديم من قبل ما الصورة تبقى إجبارية مع الطلب (اتنقل لـ confirmed من غير صورة) */}
          {!hasProof && (
            <p className="flex items-center gap-2 rounded-2xl bg-cream p-3 text-sm font-semibold text-ink-soft">
              <ImageOff className="h-[18px] w-[18px] shrink-0" aria-hidden />
              مفيش صورة إيصال متسجلة للطلب ده.
            </p>
          )}

          {hasProof && (
            proof.isLoading ? (
              <Skeleton className="h-44 w-full rounded-2xl" />
            ) : proof.data?.src ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative block w-full overflow-hidden rounded-2xl border-2 border-ink/10 bg-cream"
                aria-label="عرض صورة الإيصال بحجم كبير"
              >
                <img src={proof.data.src} alt="" loading="lazy" className="h-44 w-full object-cover object-top" />
                <span className="absolute inset-x-0 bottom-0 flex min-h-[44px] items-center justify-center gap-1.5 bg-ink/75 text-sm font-bold text-white">
                  <ZoomIn className="h-4 w-4" aria-hidden />
                  اضغط للتكبير
                </span>
              </button>
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-cream p-3 text-sm font-semibold text-ink-soft">
                <ImageOff className="h-[18px] w-[18px] shrink-0" aria-hidden />
                {proof.isError ? "مقدرناش نحمّل صورة الإيصال." : "صورة الإيصال مش موجودة."}
              </p>
            )
          )}

          {hasProof && (
            <p className="rounded-2xl bg-brand-yellow-soft px-3 py-2.5 text-sm text-ink">
              راجع الصورة وتأكد إن المبلغ <strong>{formatPrice(order.totalPrice)}</strong> ووصل للرقم{" "}
              <bdi dir="ltr" className="font-bold">{destination || "—"}</bdi>.
            </p>
          )}
        </div>
      )}

      {proof.data?.src && (
        <ProofLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={proof.data.src}
          title={`إيصال طلب #${order.orderNumber}`}
          downloadName={`receipt-${order.orderNumber}.jpg`}
        />
      )}
    </section>
  );
}
