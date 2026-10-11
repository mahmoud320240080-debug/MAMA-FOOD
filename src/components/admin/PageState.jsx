import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "@/components/common/Button";
import LottieAnimation from "@/components/common/LottieAnimation";

/** حالة الخطأ في صفحات الأدمن (نفس شكل صفحة الوجبات) */
export function PageError({ title, error, onRetry }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center text-ink shadow-soft">
      <AlertCircle className="mx-auto mb-3 h-12 w-12 text-brand-red" aria-hidden />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-ink-soft">{error?.message || "حدث خطأ غير متوقع"}</p>
      {onRetry && (
        <Button onClick={() => onRetry()} className="mt-6">
          <RefreshCw className="h-4 w-4" aria-hidden />
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

/** حالة فاضية: أنيميشن Lottie (أو أيقونة) + عنوان + وصف + أكشن اختياري */
export function EmptyState({ animation, icon: Icon, title, description, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/20 bg-white px-6 py-10 text-center text-ink shadow-soft">
      {animation ? (
        <LottieAnimation name={animation} size={132} className="mx-auto mb-1" />
      ) : (
        Icon && <Icon className="mx-auto mb-3 h-10 w-10 text-brand-red" aria-hidden />
      )}
      <p className="text-base font-bold">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
