import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api";
import { LogoFull } from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import DayPicker from "@/components/customer/DayPicker";
import DayAccordion from "@/components/customer/DayAccordion";
import AddonsSheet from "@/components/customer/AddonsSheet";
import HeroHats from "@/components/customer/HeroHats";
import { useCartStore } from "@/store/useCartStore";
import { itemsCount } from "@/lib/cart";
import { haptic } from "@/lib/haptics";
import { DAYS_SECTION_ID, scrollToSection } from "@/lib/scroll";

/* ═══════════════ Hero ═══════════════ */
function Hero() {
  return (
    // طول الشاشة الظاهرة (hero-screen في index.css) والكارت في النص رأسياً
    <section className="hero-screen flex flex-col justify-center bg-chef-pattern px-4 py-10 md:py-16">
      <div className="relative isolate mx-auto w-full max-w-3xl overflow-hidden rounded-4xl bg-brand-red p-8 text-center text-white shadow-pop md:p-12">
        <HeroHats />
        <div className="relative">
          <LogoFull tone="onRed" priority className="mx-auto w-56 md:w-72" />
          <h1 className="mt-6 text-3xl font-extrabold leading-tight md:text-5xl">
            أكل بيتي زي بتاع ماما
          </h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-white/90">
            اختار الأيام اللي عايز تطلب فيها، وبعدين وجباتك وإضافاتك لكل يوم.
          </p>
          <Button
            variant="secondary"
            size="xl"
            onClick={() => scrollToSection(DAYS_SECTION_ID)}
            className="mt-7"
          >
            اختار أيامك
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════ Home ═══════════════ */
export default function Home() {
  const { data: days, isLoading, isError, refetch } = useQuery({
    queryKey: ["upcoming"],
    queryFn: menuApi.getUpcoming,
    staleTime: 0, // ميعاد القفل جاي من إعدادات الأدمن
  });

  const selectedDates = useCartStore((s) => s.selectedDates);
  const items = useCartStore((s) => s.items);
  const toggleDate = useCartStore((s) => s.toggleDate);
  const pruneInvalid = useCartStore((s) => s.pruneInvalid);

  // أكورديون مفتوح
  const [openAccordion, setOpenAccordion] = useState(null);
  // شيت الإضافات
  const [addonsState, setAddonsState] = useState({ open: false, meal: null, date: null });
  // مودال تأكيد حذف يوم
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // جاي من زرار "اختار أيامك" في الناف بار من صفحة تانية (/#days)
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === `#${DAYS_SECTION_ID}`) scrollToSection(DAYS_SECTION_ID);
  }, [hash]);

  // Prune invalid items once on load
  const prunedRef = useRef(false);
  useEffect(() => {
    if (days && !prunedRef.current) {
      pruneInvalid(days);
      prunedRef.current = true;
    }
  }, [days, pruneInvalid]);

  // فتح أول يوم محدد بشكل افتراضي
  useEffect(() => {
    if (selectedDates.length > 0 && !openAccordion) {
      setOpenAccordion(selectedDates[0]);
    }
  }, [selectedDates, openAccordion]);

  const handleDayToggle = useCallback(
    (date) => {
      if (selectedDates.includes(date)) {
        // لو فيه عناصر في اليوم ده، نأكد الحذف
        const dayItems = items.filter((it) => it.date === date);
        if (dayItems.length > 0) {
          setRemoveConfirm(date);
        } else {
          toggleDate(date);
        }
      } else {
        toggleDate(date);
        setOpenAccordion(date);
        haptic();
      }
    },
    [selectedDates, items, toggleDate]
  );

  const confirmRemoveDay = () => {
    if (removeConfirm) {
      toggleDate(removeConfirm);
      if (openAccordion === removeConfirm) setOpenAccordion(null);
      setRemoveConfirm(null);
    }
  };

  const handleAddonsClick = useCallback((meal, date) => {
    setAddonsState({ open: true, meal, date });
  }, []);

  // الأيام المحددة مع بياناتها
  const selectedDays = days
    ? selectedDates
        .map((d) => days.find((dd) => dd.date === d))
        .filter(Boolean)
    : [];

  const hasItems = itemsCount(items) > 0;

  return (
    <>
      <Hero />

      {/* ═══ اختار أيامك ═══ (scroll-margin = ارتفاع الناف بار الثابت + مسافة، عشان العنوان ما يستخباش تحته) */}
      <section id={DAYS_SECTION_ID} className="mx-auto max-w-6xl scroll-mt-[calc(4rem+var(--safe-top)+0.75rem)] px-4 py-10">
        <h2 tabIndex={-1} className="text-2xl font-extrabold focus-visible:ring-0 focus-visible:ring-offset-0 md:text-3xl">اختار أيامك</h2>
        <p className="mb-5 mt-1 text-ink-soft">
          حدد الأيام اللي عايز تطلب فيها، وبعد كده اختار وجباتك لكل يوم.
        </p>

        {isError ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-soft">
            <p className="mb-4 font-semibold">مقدرناش نحمّل الأيام.</p>
            <Button onClick={() => refetch()}>حاول تاني</Button>
          </div>
        ) : (
          <DayPicker
            days={days || []}
            isLoading={isLoading}
            selectedDates={selectedDates}
            onToggle={handleDayToggle}
          />
        )}
      </section>

      {/* ═══ الأيام المحددة (أكورديونز) ═══ */}
      {selectedDays.length > 0 && (
        <section className={`mx-auto max-w-6xl px-4 ${hasItems ? "pb-12 md:pb-28" : "pb-12"}`}>
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl">
            وجبات الأيام المختارة
          </h2>
          <div className="space-y-3">
            {selectedDays.map((day) => (
              <DayAccordion
                key={day.date}
                day={day}
                isOpen={openAccordion === day.date}
                onToggle={() =>
                  setOpenAccordion((prev) => (prev === day.date ? null : day.date))
                }
                onAddonsClick={handleAddonsClick}
              />
            ))}
          </div>
        </section>
      )}

      {/* ═══ شيت الإضافات ═══ */}
      <AddonsSheet
        open={addonsState.open}
        onClose={() => setAddonsState({ open: false, meal: null, date: null })}
        meal={addonsState.meal}
        date={addonsState.date}
        selectedDates={selectedDates}
        days={days}
      />


      {/* ═══ مودال تأكيد حذف يوم ═══ */}
      <Modal
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        title="حذف اليوم؟"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" block onClick={() => setRemoveConfirm(null)}>
              لا
            </Button>
            <Button variant="danger" block onClick={confirmRemoveDay}>
              أيوه، احذف
            </Button>
          </div>
        }
      >
        <p>
          اليوم ده فيه وجبات في السلة. لو شيلته هيتحذفوا. متأكد؟
        </p>
      </Modal>
    </>
  );
}
