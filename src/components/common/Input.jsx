import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

const Input = forwardRef(function Input({ label, error, hint, as: Tag = "input", className, id, ...props }, ref) {
  const auto = useId();
  const inputId = id || auto;
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold">{label}</label>}
      <Tag
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn(
          "min-h-[48px] w-full rounded-2xl border-2 bg-white px-4 py-3 text-base text-ink transition placeholder:text-ink-soft/60",
          "disabled:cursor-not-allowed disabled:bg-cream-dark disabled:text-ink-soft",
          "focus:border-brand-red focus:outline-none",
          error ? "border-brand-red" : "border-ink/10",
          Tag === "textarea" && "min-h-[96px] resize-y",
          className)}
        {...props}
      />
      {error ? <p id={`${inputId}-err`} className="mt-1 text-sm font-medium text-brand-red">{error}</p>
        : hint && <p className="mt-1 text-sm opacity-75">{hint}</p>}
    </div>
  );
});
export default Input;
