import { useEffect, useId, useState } from "react";
import { ImageUp, RefreshCw } from "lucide-react";
import { PROOF_TYPES, validateProofFile } from "@/lib/payments";
import { formatFileSize } from "@/lib/image";
import { cn } from "@/lib/cn";

/**
 * اختيار صورة التحويل (controlled): اضغط للاختيار (أو اسحب وسيب على الديسكتوب) => معاينة باسم الملف وحجمه.
 * file/onChange من الأب (الصورة بتتبعت مع الطلب نفسه في صفحة الطلب). النوع والحجم بيتحققوا هنا لحظة الاختيار،
 * و error = رسالة الأب (زي "ارفع صورة التحويل عشان تكمّل" لو داس تأكيد من غير صورة).
 */
export default function ProofUploader({ file, onChange, error: externalError, disabled }) {
  const inputId = useId();
  const [preview, setPreview] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const error = fileError || externalError;

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f) => {
    if (!f) return;
    const invalid = validateProofFile(f);
    setFileError(invalid);
    if (!invalid) onChange(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    pick(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <input
        id={inputId}
        type="file"
        accept={PROOF_TYPES.join(",")}
        className="peer sr-only"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = ""; // نفس الصورة تاني تنفع تتختار
        }}
        disabled={disabled}
        aria-label="صورة التحويل"
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
      />
      {file && preview ? (
        <div className="overflow-hidden rounded-2xl border-2 border-ink/10 bg-white">
          <img src={preview} alt="معاينة صورة التحويل" className="max-h-80 w-full bg-cream object-contain" />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 p-3">
            <p className="min-w-0 text-sm">
              <span className="block truncate font-bold" dir="auto">{file.name}</span>
              <span className="text-ink-soft">{formatFileSize(file.size)}</span>
            </p>
            <label
              htmlFor={inputId}
              className={cn("inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink/10 px-4 text-sm font-bold transition hover:border-brand-red", disabled && "pointer-events-none opacity-50")}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              تغيير الصورة
            </label>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "flex min-h-[168px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-5 text-center transition",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2",
            dragging ? "border-brand-red bg-brand-red/5" : error ? "border-brand-red bg-cream" : "border-ink/20 bg-cream hover:border-brand-red"
          )}
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-red shadow-sm">
            <ImageUp className="h-6 w-6" aria-hidden />
          </span>
          <span className="font-bold">اضغط واختار صورة التحويل</span>
          <span className="hidden text-sm text-ink-soft md:block">أو اسحب الصورة وسيبها هنا</span>
          <span className="text-xs text-ink-soft">JPG أو PNG أو WebP، لحد 10 ميجا</span>
        </label>
      )}

      {error && (
        <p id={`${inputId}-err`} role="alert" className="text-sm font-semibold text-brand-red">{error}</p>
      )}
    </div>
  );
}
