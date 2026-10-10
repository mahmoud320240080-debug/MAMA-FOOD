import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ClipboardList, UtensilsCrossed, CalendarDays, Plus, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { Brand } from "@/components/common/Logo";
import Overlay from "@/components/common/Overlay";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/cn";

const links = [
  { to: "/admin/orders", label: "الطلبات", Icon: ClipboardList },
  { to: "/admin/menu", label: "المنيو الأسبوعي", Icon: CalendarDays },
  { to: "/admin/meals", label: "الوجبات", Icon: UtensilsCrossed },
  { to: "/admin/addons", label: "الإضافات", Icon: Plus },
];

function SidebarContent({ onNavigate }) {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col bg-brand-red text-white">
      <div className="px-5 pb-4 pt-6 pt-safe"><Brand tone="onRed" /><p className="mt-1 text-sm text-white/70">لوحة التحكم</p></div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate}
            className={({ isActive }) => cn(
              "flex min-h-[48px] items-center gap-3 rounded-full px-4 font-semibold transition",
              isActive ? "bg-brand-yellow text-ink" : "hover:bg-white/10")}>
            <Icon className="h-5 w-5" aria-hidden />{label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 pb-safe">
        <button onClick={() => { logout(); navigate("/admin/login"); }}
          className="flex min-h-[48px] w-full items-center gap-3 rounded-full px-4 font-semibold hover:bg-white/10">
          <LogOut className="h-5 w-5" aria-hidden />تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 lg:block"><SidebarContent /></aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-red px-4 pt-safe lg:hidden">
        <div className="flex h-16 w-full items-center justify-between">
          <Brand tone="onRed" />
          <button onClick={() => setOpen(true)} aria-label="فتح القائمة"
            className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10"><MenuIcon className="h-6 w-6" /></button>
        </div>
      </header>

      {/* Mobile drawer */}
      <Overlay open={open} onClose={() => setOpen(false)} align="start">
        <div className="relative z-10 me-auto ms-0 h-full w-72 animate-drawer-in self-stretch overflow-hidden rounded-s-4xl" style={{ marginInlineStart: 0 }}>
          <button onClick={() => setOpen(false)} aria-label="إغلاق"
            className="absolute end-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-white"><X className="h-6 w-6" /></button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </Overlay>

      <main className="lg:ms-64"><div className="mx-auto max-w-6xl p-4 md:p-8"><Outlet /></div></main>
    </div>
  );
}
