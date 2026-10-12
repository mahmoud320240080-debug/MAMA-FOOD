import { LogoFull } from "@/components/common/Logo";
import { BRAND } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-chef-pattern pb-safe">
      <div className="absolute inset-0 bg-brand-red/90" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center text-white">
        <LogoFull tone="onRed" className="w-44" />
        <p className="max-w-xs text-white/90">أكل بيتي مطبوخ بحب، طازة كل يوم.</p>
        <p className="text-sm font-semibold text-white">© {new Date().getFullYear()} {BRAND.name}</p>
      </div>
    </footer>
  );
}
