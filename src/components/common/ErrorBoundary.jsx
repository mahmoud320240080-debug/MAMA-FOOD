import { Component } from "react";
import { RefreshCw } from "lucide-react";
import Button from "./Button";
import { LogoIcon } from "./Logo";
import { cn } from "@/lib/cn";

// ملف JS اتغير بعد نشر نسخة جديدة => "إعادة المحاولة" لازم تعمل reload عشان تجيب الملف الجديد
const isChunkError = (e) => /dynamically imported module|Importing a module script failed|Loading chunk/i.test(e?.message || "");

/** شاشة الخطأ: page = الموقع كله (ملء الشاشة) | section = جوه لوحة التحكم (السايدبار فاضل شغال) */
function ErrorFallback({ variant, homeHref, homeLabel, onRetry }) {
  const page = variant === "page";
  return (
    <div role="alert" className={cn("grid place-items-center px-4 text-center text-ink", page ? "min-h-dvh bg-cream py-12 pb-safe pt-safe" : "py-10")}>
      <div className={cn("w-full max-w-md", !page && "rounded-3xl bg-white p-8 shadow-soft")}>
        <LogoIcon tone="onLight" className="mx-auto mb-5 w-20" />
        <h1 className="text-2xl font-extrabold md:text-3xl">حصلت مشكلة في المطبخ 🍳</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          حاجة وقعت مننا وإحنا بنجهز الصفحة. جرّب تاني، ولو المشكلة فضلت ارجع للبداية.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onRetry}>
            <RefreshCw className="h-5 w-5" aria-hidden />
            إعادة المحاولة
          </Button>
          {/* <a> عادي مش Link: الشاشة دي ممكن تظهر والراوتر نفسه هو اللي واقع */}
          <Button as="a" href={homeHref} variant="outline">{homeLabel}</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * بيمسك أي خطأ في الرندر تحته ويعرض شاشة بالعربي بدل صفحة بيضا.
 * الخطأ بيتكتب في الكونسول بس. resetKey (زي المسار) بيتغير => الشاشة بتختفي لوحدها.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[MAMA FOOD] UI error:", error, info?.componentStack);
  }

  componentDidUpdate(prev) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  retry = () => {
    if (isChunkError(this.state.error)) window.location.reload();
    else this.setState({ error: null });
  };

  render() {
    const { variant = "page", homeHref = "/", homeLabel = "ارجع للرئيسية", children } = this.props;
    if (!this.state.error) return children;
    return <ErrorFallback variant={variant} homeHref={homeHref} homeLabel={homeLabel} onRetry={this.retry} />;
  }
}
