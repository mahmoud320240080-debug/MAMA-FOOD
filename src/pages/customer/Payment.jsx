import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Home, SearchX, XCircle } from "lucide-react";
import { ordersApi } from "@/api";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";

/** حالة كاملة في نص الصفحة (طلب مش موجود / ملغي): أيقونة + عنوان + كلام + رجوع للرئيسية */
function Notice({ icon: Icon, title, children }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <span className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-brand-red/10 text-brand-red">
        <Icon className="h-10 w-10" aria-hidden />
      </span>
      <h1 className="text-2xl font-extrabold">{title}</h1>
      <div className="mt-2 text-ink-soft">{children}</div>
      <div className="mt-6 space-y-3 pb-safe">
        <Button as={Link} to="/" variant="outline" block>
          <Home className="h-5 w-5" aria-hidden />
          رجوع للرئيسية
        </Button>
      </div>
    </div>
  );
}

/**
 * لينكات /payment/:orderId القديمة: صورة التحويل بقت بتترفع مع الطلب نفسه في صفحة الطلب،
 * فالصفحة دي بتحوّل على صفحة تأكيد الطلب (replace). الطلب المش موجود والملغي ليهم رسالتهم.
 */
export default function Payment() {
  const { orderId } = useParams();

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.get(orderId),
    retry: (count, e) => e?.message !== "الطلب مش موجود" && count < 1,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-8" aria-busy="true">
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-44 rounded-3xl" />
      </div>
    );
  }

  if (isError) {
    return error?.message === "الطلب مش موجود" ? (
      <Notice icon={SearchX} title="الطلب مش موجود">يمكن اللينك غلط أو الطلب اتمسح.</Notice>
    ) : (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <CircleAlert className="mx-auto mb-3 h-12 w-12 text-brand-red" aria-hidden />
        <h1 className="text-2xl font-extrabold">حصلت مشكلة</h1>
        <p className="mb-6 mt-2 text-ink-soft">{error?.message || "مقدرناش نجيب بيانات الطلب."}</p>
        <Button onClick={() => refetch()}>إعادة المحاولة</Button>
      </div>
    );
  }

  if (order.status === "cancelled") {
    return <Notice icon={XCircle} title="الطلب ده اتلغى">لو عندك سؤال كلّمنا على واتساب.</Notice>;
  }

  return <Navigate to={`/order-success/${orderId}`} replace />;
}
