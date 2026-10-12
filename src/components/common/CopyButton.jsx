import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { copyText } from "@/lib/clipboard";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

/** زرار "نسخ" برسالة في التوستر (ولو النسخ مش متاح بيقول للزبون ينسخ يدوي) */
export default function CopyButton({ value, label = "نسخ", successMessage = "اتنسخ", className }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    if (await copyText(value)) {
      setCopied(true);
      toast.success(successMessage);
    } else {
      toast.info(`النسخ مش متاح هنا، انسخه يدوي: ${value}`, { ms: 6000 });
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        "inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border-2 border-ink/10 bg-white px-4 text-sm font-bold text-ink transition hover:border-brand-red active:scale-95 motion-reduce:active:scale-100",
        className
      )}
    >
      {copied ? <Check className="h-4 w-4 text-green-700" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? "اتنسخ" : label}
    </button>
  );
}
