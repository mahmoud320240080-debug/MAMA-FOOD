import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-brand-red text-white shadow-pop hover:bg-brand-red-dark active:scale-[.98]",
  secondary: "bg-brand-yellow text-ink hover:brightness-95 active:scale-[.98]",
  outline: "border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-ink text-white hover:bg-black",
};
const sizes = {
  sm: "min-h-[44px] px-4 text-sm",
  md: "min-h-[48px] px-6 text-base",
  lg: "min-h-[56px] px-8 text-lg",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, as: Tag = "button", ...props }, ref) {
  return (
    <Tag
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant], sizes[size], block && "w-full", className)}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </Tag>
  );
});
export default Button;
