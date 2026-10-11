import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { springs } from "@/lib/motion";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

const styles = {
  success: { cls: "bg-ink text-white", Icon: CheckCircle2, icon: "text-brand-yellow", btnCls: "bg-white/20 text-white hover:bg-white/30" },
  error: { cls: "bg-brand-red text-white", Icon: AlertCircle, icon: "text-white", btnCls: "bg-white/20 text-white hover:bg-white/30" },
  info: { cls: "bg-brand-yellow text-ink", Icon: Info, icon: "text-ink", btnCls: "bg-ink text-brand-yellow hover:bg-black" },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-4 pt-safe">
      <AnimatePresence initial={false}>
      {toasts.map((t) => {
        const { cls, Icon, icon, btnCls } = styles[t.type] || styles.info;
        return (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
            transition={springs.pop}
            onClick={() => dismiss(t.id)}
            role="status"
            className={cn(
              "pointer-events-auto flex min-h-[48px] w-full max-w-sm items-center justify-between gap-3 rounded-full px-5 py-2 text-start font-semibold shadow-soft cursor-pointer",
              cls
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className={cn("h-5 w-5 shrink-0", icon)} aria-hidden />
              <span>{t.message}</span>
            </div>
            {t.action && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  t.action.onClick?.();
                  dismiss(t.id);
                }}
                className={cn(
                  "min-h-[44px] shrink-0 rounded-full px-4 text-sm font-bold shadow-sm transition active:scale-95",
                  btnCls
                )}
              >
                {t.action.label}
              </button>
            )}
          </m.div>
        );
      })}
      </AnimatePresence>
    </div>
  );
}
