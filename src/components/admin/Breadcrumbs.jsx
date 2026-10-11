import { useLocation, useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { ordersApi } from "@/api";

// خريطة المسارات الثابتة لتسهيل إضافة صفحات جديدة مستقبلاً
const ROUTE_MAP = {
  "/admin/dashboard": "نظرة عامة",
  "/admin/menu": "المنيو الأسبوعي",
  "/admin/meals": "الوجبات",
  "/admin/addons": "الإضافات",
  "/admin/orders": "الطلبات",
  "/admin/settings": "الإعدادات",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const { id } = useParams();
  const pathname = location.pathname.replace(/\/+$/, "");

  // في حالة صفحة تفاصيل الطلب (/admin/orders/:id)
  const isOrderDetails = pathname.startsWith("/admin/orders/") && !!id;

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.get(id),
    enabled: isOrderDetails,
    staleTime: 60_000,
  });

  const segments = [
    { label: "لوحة التحكم", to: "/admin/dashboard" },
  ];

  if (isOrderDetails) {
    segments.push({ label: "الطلبات", to: "/admin/orders" });
    const orderLabel = isLoading
      ? "طلب..."
      : order?.orderNumber
        ? `طلب #${order.orderNumber}`
        : `طلب #${id}`;
    segments.push({ label: orderLabel, to: null });
  } else if (ROUTE_MAP[pathname]) {
    segments.push({ label: ROUTE_MAP[pathname], to: null });
  }

  return (
    <div role="navigation" aria-label="مسار التنقل" className="mb-2.5">
      <ol className="flex flex-wrap items-center gap-1 text-xs font-semibold text-ink-soft sm:text-sm">
        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1;

          return (
            <li key={idx} className="flex items-center gap-1 min-w-0">
              {idx > 0 && (
                <ChevronLeft
                  className="h-4 w-4 shrink-0 text-ink-soft/40"
                  aria-hidden
                />
              )}

              {isLast || !seg.to ? (
                <span
                  aria-current="page"
                  className="inline-flex min-h-[44px] items-center max-w-[150px] truncate px-1 font-bold text-ink sm:max-w-[240px]"
                  title={seg.label}
                >
                  {seg.label}
                </span>
              ) : (
                <Link
                  to={seg.to}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center px-1 max-w-[120px] truncate transition hover:text-brand-red sm:max-w-none"
                  title={seg.label}
                >
                  {seg.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
