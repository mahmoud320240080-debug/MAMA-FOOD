import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { m } from "framer-motion";
import { ChevronsLeft, ChevronsRight, ClipboardList, LogOut, Search, UtensilsCrossed, X } from "lucide-react";
import Overlay from "@/components/common/Overlay";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import { ADMIN_PAGES } from "@/components/admin/adminNav";
import { mealsApi, ordersApi } from "@/api";
import { useAdminStore } from "@/store/useAdminStore";
import { useIsDesktop, useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { formatPrice } from "@/lib/format";
import { matchesSearch, normalizeSearch } from "@/lib/search";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

const MAX_RESULTS = 5;
const optionId = (i) => `cmd-opt-${i}`;

/**
 * Command Palette للأدمن: Ctrl+K / ⌘K أو زرار البحث في الهيدر.
 * صفحات + طلبات (رقم/اسم/موبايل) + وجبات + أكشنز. الكيبورد: ↑↓ و Enter و Esc.
 * نمط combobox: الـ focus فاضل في الإنبوت، والاختيار الحالي بيتعلن بـ aria-activedescendant.
 */
export default function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const hasSidebar = useMediaQuery("(min-width: 1024px)");
  const reduced = useReducedMotion();
  const sidebarCollapsed = useAdminStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAdminStore((s) => s.toggleSidebar);
  const clearToken = useAdminStore((s) => s.clearToken);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const returnFocus = useRef(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  // Ctrl+K / ⌘K من أي حتة في الأدمن (code عشان يشتغل والكيبورد عربي كمان)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === "KeyK" || e.key.toLowerCase() === "k")) {
        e.preventDefault();
        onOpenChange((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  // فتح: نفتكر مين كان عليه الـ focus ونحطه في الإنبوت. قفل: نفضّي البحث والـ focus يرجع مكانه
  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement;
      inputRef.current?.focus({ preventScroll: true });
      return;
    }
    setQuery("");
    setActive(0);
    const el = returnFocus.current;
    returnFocus.current = null;
    if (el?.isConnected) el.focus({ preventScroll: true });
  }, [open]);

  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.list(), enabled: open });
  const { data: meals = [] } = useQuery({ queryKey: ["meals"], queryFn: mealsApi.list, enabled: open });

  const sections = useMemo(() => {
    const q = normalizeSearch(query).replace(/^#/, "");
    const go = (to) => () => navigate(to);

    const pages = ADMIN_PAGES.filter((p) => matchesSearch(q, p.label, p.keywords)).map((p) => ({
      id: `page-${p.to}`, label: p.label, Icon: p.Icon, run: go(p.to),
    }));

    const actions = [
      hasSidebar && {
        id: "sidebar",
        label: sidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية",
        keywords: "sidebar collapse expand toggle القائمة",
        Icon: sidebarCollapsed ? ChevronsLeft : ChevronsRight,
        run: toggleSidebar,
      },
      {
        id: "logout", label: "تسجيل الخروج", keywords: "logout sign out خروج", Icon: LogOut,
        run: () => { clearToken(); navigate("/admin/login", { replace: true }); },
      },
    ].filter((a) => a && matchesSearch(q, a.label, a.keywords));

    const orderItems = q
      ? orders
          .filter((o) => matchesSearch(q, o.orderNumber, o.customer?.name, o.customer?.phone))
          .slice(0, MAX_RESULTS)
          .map((o) => ({
            id: `order-${o.id}`,
            label: `#${o.orderNumber} — ${o.customer?.name || ""}`,
            Icon: ClipboardList,
            end: (
              <span className="flex shrink-0 items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <span className="hidden whitespace-nowrap text-sm font-bold text-ink sm:inline">{formatPrice(o.totalPrice)}</span>
              </span>
            ),
            run: go(`/admin/orders/${o.id}`),
          }))
      : [];

    const mealItems = q
      ? meals
          .filter((meal) => matchesSearch(q, meal.name))
          .slice(0, MAX_RESULTS)
          .map((meal) => ({
            id: `meal-${meal.id}`, label: meal.name, Icon: UtensilsCrossed,
            end: <span className="whitespace-nowrap text-sm text-ink-soft">{formatPrice(meal.price)}</span>,
            run: go("/admin/meals"),
          }))
      : [];

    return [
      { key: "pages", title: "الصفحات", items: pages },
      { key: "orders", title: "الطلبات", items: orderItems },
      { key: "meals", title: "الوجبات", items: mealItems },
      { key: "actions", title: "أكشنز", items: actions },
    ].filter((s) => s.items.length);
  }, [query, orders, meals, hasSidebar, sidebarCollapsed, toggleSidebar, clearToken, navigate]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const activeIndex = Math.min(active, Math.max(flat.length - 1, 0));

  // الاختيار الحالي يفضل باين في القايمة
  useEffect(() => {
    if (open) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const run = (item) => {
    close();
    item.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (e.key === "Enter" && e.target === inputRef.current && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (flat[activeIndex]) run(flat[activeIndex]);
    } else if (e.key === "Tab") {
      // focus trap: الإنبوت وزرار الإغلاق بس
      const focusables = [...dialogRef.current.querySelectorAll("input, button:not([tabindex='-1'])")];
      const i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      focusables[(i + (e.shiftKey ? -1 : 1) + focusables.length) % focusables.length]?.focus();
    }
  };

  // موبايل: فل سكرين والإنبوت فوق (الكيبورد تحت ما يغطيهوش). تابلت/ديسكتوب: مودال فوق في النص
  const hidden = reduced ? { opacity: 0 } : isDesktop ? { opacity: 0, scale: 0.96 } : { opacity: 0, y: 24 };
  let index = -1;

  return (
    <Overlay open={open} onClose={close} align="start">
      <m.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="بحث سريع"
        data-command-palette
        onKeyDown={onKeyDown}
        initial={hidden}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={hidden}
        transition={springs.overlay}
        className="relative z-10 flex h-dvh w-full flex-col overflow-hidden bg-cream pt-safe shadow-pop md:mt-[12vh] md:h-auto md:max-h-[min(72vh,600px)] md:max-w-xl md:self-start md:rounded-4xl md:pt-0"
      >
        <div className="flex items-center gap-2 border-b border-ink/10 bg-white px-3 focus-within:border-brand-red md:px-4">
          <Search className="h-5 w-5 shrink-0 text-ink-soft" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="cmd-list"
            aria-autocomplete="list"
            aria-activedescendant={flat.length ? optionId(activeIndex) : undefined}
            aria-label="دوّر على صفحة، طلب أو وجبة"
            placeholder="دوّر على صفحة، طلب أو وجبة..."
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            className="h-16 min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-ink-soft/70 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <button
            type="button"
            onClick={close}
            aria-label="إغلاق"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink transition hover:bg-ink/5"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </div>

        <div id="cmd-list" role="listbox" aria-label="النتايج" className="flex-1 overflow-y-auto overscroll-contain p-2 pb-safe">
          {flat.length === 0 ? (
            <p className="px-4 py-10 text-center font-semibold text-ink-soft" role="status">مفيش نتايج</p>
          ) : (
            sections.map((section) => (
              <div key={section.key} role="group" aria-labelledby={`cmd-group-${section.key}`} className="mb-1">
                <p id={`cmd-group-${section.key}`} className="px-3 pb-1 pt-3 text-xs font-bold text-ink-soft">{section.title}</p>
                {section.items.map((item) => {
                  index += 1;
                  const i = index;
                  const selected = i === activeIndex;
                  return (
                    <div
                      key={item.id}
                      id={optionId(i)}
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => !selected && setActive(i)}
                      onClick={() => run(item)}
                      className={cn(
                        "flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-ink",
                        selected ? "bg-brand-yellow-soft ring-2 ring-inset ring-ink/15" : "hover:bg-ink/5"
                      )}
                    >
                      <item.Icon className="h-5 w-5 shrink-0 text-brand-red" aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-semibold">{item.label}</span>
                      {item.end}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <p className="hidden border-t border-ink/10 bg-white px-4 py-2.5 text-xs text-ink-soft md:block">
          <kbd className="font-body font-bold">↑ ↓</kbd> للتنقل · <kbd className="font-body font-bold">Enter</kbd> للفتح · <kbd className="font-body font-bold">Esc</kbd> للإغلاق
        </p>
      </m.div>
    </Overlay>
  );
}
