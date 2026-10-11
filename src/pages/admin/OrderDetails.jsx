import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, MapPin, MessageCircle, Phone, StickyNote, User } from "lucide-react";
import { ordersApi } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import Reveal from "@/components/common/Reveal";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import { PageError } from "@/components/admin/PageState";
import { groupItemsByDate, lineTotal, daySubtotal } from "@/lib/cart";
import { formatDayLabel } from "@/lib/dates";
import { formatDateTime, formatPrice } from "@/lib/format";
import { customerWhatsappUrl } from "@/lib/whatsapp";

const card = "rounded-3xl bg-white p-5 text-ink shadow-soft";

function BackLink() {
  const { state } = useLocation();
  return (
    <Link
      to={`/admin/orders${state?.from || ""}`}
      className="-ms-2 inline-flex min-h-[44px] items-center gap-2 rounded-full px-2 text-sm font-bold text-ink transition hover:text-brand-red"
    >
      {/* RTL: الرجوع سهم لليمين */}
      <ArrowRight className="h-5 w-5" aria-hidden />
      كل الطلبات
    </Link>
  );
}

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-red" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink-soft">{label}</p>
        <div className="font-semibold [overflow-wrap:anywhere]">{children}</div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div className={strong ? "flex items-center justify-between gap-3 text-lg font-extrabold" : "flex items-center justify-between gap-3 text-sm"}>
      <span className={strong ? "" : "text-ink-soft"}>{label}</span>
      <span className={strong ? "text-end text-brand-red [overflow-wrap:anywhere]" : "text-end font-semibold [overflow-wrap:anywhere]"}>{value}</span>
    </div>
  );
}

export default function OrderDetails() {
  const { id } = useParams();
  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="space-y-5" aria-busy="true">
        <BackLink />
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-12 w-56" />
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-5">
        <BackLink />
        <PageError title="تعذر تحميل الطلب" error={error} onRetry={refetch} />
      </div>
    );
  }

  const grouped = groupItemsByDate(order.items);
  const dates = Object.keys(grouped).sort();
  const { customer } = order;

  return (
    <div className="space-y-5">
      <BackLink />

      {/* الهيدر */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold md:text-3xl">طلب #{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">اتعمل {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="text-xs font-semibold text-ink-soft">تغيير الحالة</span>
          <OrderStatusSelect order={order} className="w-full sm:w-48" />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* الأصناف مجمعة باليوم */}
        <div className="min-w-0 space-y-4">
          {dates.map((date, i) => (
            <Reveal as="section" index={i} key={date} className={card}>
              <header className="mb-3 flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
                <h2 className="text-lg font-extrabold">{formatDayLabel(date)}</h2>
                <span className="max-w-[45%] shrink-0 text-end text-sm font-bold text-ink-soft [overflow-wrap:anywhere]">{formatPrice(daySubtotal(grouped[date]))}</span>
              </header>
              <ul className="divide-y divide-ink/5">
                {grouped[date].map((item) => (
                  <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="grid h-9 min-w-[2.25rem] shrink-0 place-items-center rounded-xl bg-brand-red px-1.5 text-sm font-black text-white">
                      {item.quantity}×
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold [overflow-wrap:anywhere]">{item.name}</p>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <span className="text-xs text-ink-soft">{formatPrice(item.price)} للواحدة</span>
                        <span className="ms-auto text-end font-extrabold [overflow-wrap:anywhere]">{formatPrice(lineTotal(item))}</span>
                      </div>
                      {item.addons.length > 0 && (
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {item.addons.map((a) => (
                            <li key={a.id} className="rounded-full bg-cream-dark px-2.5 py-0.5 text-xs font-semibold text-ink">
                              {a.name} · {a.price === 0 ? "مجاني" : `+${formatPrice(a.price)}`}
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.note && (
                        <p className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-brand-yellow-soft px-2.5 py-1.5 text-sm text-ink [overflow-wrap:anywhere]">
                          <StickyNote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          {item.note}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* العميل والحساب */}
        <div className="min-w-0 space-y-4 lg:sticky lg:top-6">
          <section className={card}>
            <h2 className="mb-4 text-lg font-extrabold">العميل</h2>
            <div className="space-y-3">
              <InfoRow icon={User} label="الاسم">{customer.name}</InfoRow>
              <InfoRow icon={Phone} label="الموبايل"><span dir="ltr">{customer.phone}</span></InfoRow>
              <InfoRow icon={MapPin} label="العنوان">{customer.address}</InfoRow>
              {customer.notes && <InfoRow icon={StickyNote} label="ملاحظات">{customer.notes}</InfoRow>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button as="a" href={`tel:${customer.phone}`} size="sm" className="px-3">
                <Phone className="h-4 w-4" aria-hidden />
                اتصال
              </Button>
              <Button as="a" href={customerWhatsappUrl(customer.phone)} target="_blank" rel="noopener noreferrer" variant="secondary" size="sm" className="px-3">
                <MessageCircle className="h-4 w-4" aria-hidden />
                واتساب
              </Button>
            </div>
          </section>

          <section className={card}>
            <h2 className="mb-3 text-lg font-extrabold">الحساب</h2>
            <div className="space-y-2">
              <SummaryRow label="المجموع" value={formatPrice(order.subtotal)} />
              <SummaryRow label="التوصيل" value={formatPrice(order.deliveryFee)} />
              <hr className="border-ink/10" />
              <SummaryRow label="الإجمالي" value={formatPrice(order.totalPrice)} strong />
            </div>
            <p className="mt-3 text-xs text-ink-soft">💵 الدفع عند الاستلام</p>
          </section>
        </div>
      </div>
    </div>
  );
}
