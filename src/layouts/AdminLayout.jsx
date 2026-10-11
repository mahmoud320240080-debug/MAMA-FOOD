import { Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import {
  LogOut,
  Menu as MenuIcon,
  Search,
  X,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { Brand, LogoIcon } from "@/components/common/Logo";
import Overlay from "@/components/common/Overlay";
import Skeleton from "@/components/common/Skeleton";
import RouteTransition from "@/components/common/RouteTransition";
import { RevealGroup } from "@/components/common/Reveal";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Breadcrumbs from "@/components/admin/Breadcrumbs";
import CommandPalette from "@/components/admin/CommandPalette";
import { ADMIN_PAGES as navLinks } from "@/components/admin/adminNav";
import { springs } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useAdminStore } from "@/store/useAdminStore";
import { cn } from "@/lib/cn";

// Mac => ⌘K، غير كده Ctrl+K (للتلميح بس، الاختصار نفسه شغال بالاتنين)
const SHORTCUT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl+K";

function SidebarNav({ onNavigate, collapsed = false, onToggle, isMobile = false }) {
  const clearToken = useAdminStore((s) => s.clearToken);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col bg-brand-red text-white">
      {/* هيدر القائمة الجانبية */}
      <div
        className={cn(
          "pb-4 pt-6 pt-safe",
          collapsed ? "flex flex-col items-center px-2 gap-3" : "px-5"
        )}
      >
        {collapsed ? (
          <>
            <LogoIcon tone="onRed" className="w-10 shrink-0" />
            {!isMobile && onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label="توسيع القائمة الجانبية"
                title="توسيع القائمة الجانبية"
                className="grid h-11 w-11 place-items-center rounded-full text-white/90 transition hover:bg-white/10 active:scale-95"
              >
                <ChevronsLeft className="h-5 w-5" aria-hidden />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <Brand tone="onRed" />
              <p className="mt-1 text-sm font-semibold text-white/80">لوحة التحكم</p>
            </div>
            {!isMobile && onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-label="طي القائمة الجانبية"
                title="طي القائمة الجانبية"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/90 transition hover:bg-white/10 active:scale-95"
              >
                <ChevronsRight className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        )}
      </div>

      {/* روابط التنقل */}
      <nav className={cn("flex-1 space-y-1 py-2", collapsed ? "px-2" : "px-3")}>
        {navLinks.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex min-h-[48px] items-center rounded-2xl text-base font-bold transition",
                collapsed ? "justify-center px-0 w-full" : "gap-3 rounded-full px-4",
                isActive
                  ? "bg-brand-yellow text-ink shadow-sm"
                  : "text-white/90 hover:bg-white/10"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed && <span>{label}</span>}

            {/* تلميح عند التحويم/التركيز في وضع الطي (RTL: يظهر على يسار الشريط) */}
            {collapsed && (
              <span
                role="tooltip"
                className="pointer-events-none absolute end-full top-1/2 z-50 me-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* زر تسجيل الخروج في الأسفل */}
      <div className={cn("pb-safe", collapsed ? "p-2" : "p-3")}>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "تسجيل الخروج" : undefined}
          aria-label="تسجيل الخروج"
          className={cn(
            "group relative flex min-h-[48px] w-full items-center rounded-2xl text-base font-bold text-white transition hover:bg-white/10 active:scale-98",
            collapsed ? "justify-center px-0" : "gap-3 rounded-full px-4"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" aria-hidden />
          {!collapsed && <span>تسجيل الخروج</span>}

          {/* تلميح تسجيل الخروج في وضع الطي */}
          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none absolute end-full top-1/2 z-50 me-3 -translate-y-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              تسجيل الخروج
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { pathname } = useLocation();
  const sidebarCollapsed = useAdminStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAdminStore((s) => s.toggleSidebar);

  const rtl = document.documentElement.dir === "rtl";
  const reduced = useReducedMotion();
  const drawerHidden = reduced ? { opacity: 0 } : { x: rtl ? "100%" : "-100%" };

  return (
    <div className="min-h-dvh bg-cream">
      {/* القائمة الجانبية للديسكتوب */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden shadow-soft lg:block transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarNav
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </aside>

      {/* هيدر الموبايل والتابلت */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-brand-red px-4 pt-safe shadow-soft lg:hidden">
        <div className="flex h-16 w-full items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <Brand tone="onRed" size="nav" className="shrink-0" />
            <span className="hidden truncate text-xs font-bold text-brand-yellow min-[360px]:block">لوحة التحكم</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label={`بحث سريع (${SHORTCUT})`}
              aria-haspopup="dialog"
              aria-keyshortcuts="Control+K Meta+K"
              className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 active:scale-95"
            >
              <Search className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="فتح القائمة"
              className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 active:scale-95"
            >
              <MenuIcon className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* درور الموبايل */}
      <Overlay open={drawerOpen} onClose={() => setDrawerOpen(false)} align="start">
        {/* الدرور على الـ start: في RTL ده اليمين => بيدخل من اليمين (x موجب) */}
        <m.div
          role="dialog"
          aria-modal="true"
          aria-label="القائمة"
          data-admin-drawer
          initial={drawerHidden}
          animate={{ x: 0, opacity: 1 }}
          exit={drawerHidden}
          transition={springs.overlay}
          className="relative z-10 me-auto ms-0 h-full w-72 self-stretch overflow-hidden shadow-pop"
          style={{ marginInlineStart: 0 }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="إغلاق"
            className="absolute end-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
          <SidebarNav
            onNavigate={() => setDrawerOpen(false)}
            isMobile
            collapsed={false}
          />
        </m.div>
      </Overlay>

      {/* المحتوى الرئيسي */}
      <main
        className={cn(
          "transition-[margin] duration-300 ease-in-out motion-reduce:transition-none",
          sidebarCollapsed ? "lg:ms-20" : "lg:ms-64"
        )}
      >
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <Breadcrumbs />
            {/* الديسكتوب مفيهوش هيدر => زرار البحث جنب مسار التنقل */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-haspopup="dialog"
              aria-keyshortcuts="Control+K Meta+K"
              className="hidden min-h-[44px] shrink-0 items-center gap-2 rounded-full border border-ink/10 bg-white px-4 text-sm font-semibold text-ink-soft shadow-sm transition hover:border-ink/20 hover:text-ink lg:flex"
            >
              <Search className="h-4 w-4" aria-hidden />
              بحث سريع
              <kbd dir="ltr" className="rounded-md bg-cream-dark px-1.5 py-0.5 font-body text-xs font-bold text-ink">{SHORTCUT}</kbd>
            </button>
          </div>
          {/* خطأ في صفحة => الصفحة بس اللي بتتبدل، والسايدبار والبحث فاضلين شغالين */}
          <ErrorBoundary variant="section" resetKey={pathname} homeHref="/admin/dashboard" homeLabel="ارجع للوحة التحكم">
            <Suspense fallback={<div className="space-y-3"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40" /></div>}>
              <RouteTransition>
                <RevealGroup>
                  <Outlet />
                </RevealGroup>
              </RouteTransition>
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
