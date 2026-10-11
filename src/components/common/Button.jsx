import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-brand-red text-white shadow-pop hover:bg-brand-red-dark",
  secondary: "bg-brand-yellow text-ink hover:brightness-95",
  outline: "border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-ink text-white hover:bg-black",
};
const sizes = {
  sm: "min-h-[44px] px-4 text-sm",
  md: "min-h-[48px] px-6 text-base",
  lg: "min-h-[56px] px-8 text-lg",
  xl: "min-h-[60px] px-10 text-xl md:min-h-[64px] md:px-12",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, as: Tag = "button", ...props }, ref) {
  return (
    <Tag
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold",
        // ضغطة خفيفة (transform بس) — مع "تقليل الحركة" مفيش scale
        "transition-[transform,background-color,color,box-shadow,filter] duration-150 ease-out active:scale-[.97] motion-reduce:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        variants[variant], sizes[size], block && "w-full", className)}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {children}
    </Tag>
  );
});
export default Button;
