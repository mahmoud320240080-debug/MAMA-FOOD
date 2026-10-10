import { Link } from "react-router-dom";
import { Brand } from "@/components/common/Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-brand-red pt-safe shadow-soft">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" aria-label="MAMA FOOD - الرئيسية"><Brand tone="onRed" /></Link>
        {/* مكان زرار السلة (المرحلة 1) */}
        <div id="navbar-actions" className="flex items-center gap-2" />
      </div>
    </header>
  );
}
