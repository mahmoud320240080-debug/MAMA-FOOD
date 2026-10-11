import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard } from "lucide-react";
import Button from "@/components/common/Button";
import LottieAnimation from "@/components/common/LottieAnimation";

/** 404 للزبون والأدمن (مسار يبدأ بـ /admin => زرار زيادة للوحة التحكم) */
export default function NotFound() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    // نفس ارتفاع لودر الصفحات (min-h-[70vh]) => مفيش قفزة في الفوتر لما الصفحة تتحمّل
    <div className="mx-auto grid min-h-[70vh] max-w-md content-center justify-items-center px-4 py-12 text-center text-ink">
      <LottieAnimation name="notFound" size={180} className="mb-1" />
      <p className="font-display text-6xl font-extrabold leading-none text-brand-red" aria-hidden="true">404</p>
      <h1 className="mt-3 text-3xl font-extrabold">الصفحة دي مش موجودة</h1>
      <p className="mt-2 text-ink-soft">
        شكلها اتاكلت قبل ما توصلها 😋 يمكن اللينك غلط أو الصفحة اتنقلت.
        متقلقش، المطبخ لسه شغال والأكل لسه سخن.
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button as={Link} to="/">
          <Home className="h-5 w-5" aria-hidden />
          الرئيسية
        </Button>
        {isAdmin && (
          <Button as={Link} to="/admin/dashboard" variant="outline">
            <LayoutDashboard className="h-5 w-5" aria-hidden />
            لوحة التحكم
          </Button>
        )}
      </div>
    </div>
  );
}
