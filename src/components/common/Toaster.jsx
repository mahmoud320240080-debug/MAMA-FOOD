import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

const styles = {
  success: { cls: "bg-ink text-white", Icon: CheckCircle2, icon: "text-brand-yellow" },
  error: { cls: "bg-brand-red text-white", Icon: AlertCircle, icon: "text-white" },
  info: { cls: "bg-brand-yellow text-ink", Icon: Info, icon: "text-ink" },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 pt-safe">
      {toasts.map((t) => {
        const { cls, Icon, icon } = styles[t.type];
        return (
          <button key={t.id} onClick={() => dismiss(t.id)}
            className={cn("pointer-events-auto flex min-h-[48px] w-full max-w-sm animate-toast-in items-center gap-3 rounded-full px-5 py-3 text-start font-semibold shadow-soft", cls)}>
            <Icon className={cn("h-5 w-5 shrink-0", icon)} aria-hidden />
            <span>{t.message}</span>
          </button>
        );
      })}
    </div>
  );
}
