import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { menuApi } from "@/api";
import { LogoFull } from "@/components/common/Logo";
import Button from "@/components/common/Button";
import Skeleton from "@/components/common/Skeleton";
import Modal from "@/components/common/Modal";
import DayPicker from "@/components/customer/DayPicker";
import DayAccordion from "@/components/customer/DayAccordion";
import AddonsSheet from "@/components/customer/AddonsSheet";
import CartDrawer from "@/components/customer/CartDrawer";
import StickyCartBar from "@/components/customer/StickyCartBar";
import { useCartStore } from "@/store/useCartStore";
import { itemsCount } from "@/lib/cart";

/* ═══════════════ Hero ═══════════════ */
function Hero() {
  return (
    <section className="bg-chef-pattern px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl rounded-4xl bg-brand-red p-8 text-center text-white shadow-pop md:p-12">
        <LogoFull tone="onRed" className="mx-auto w-56 md:w-72" />
        <h1 className="mt-6 text-3xl font-extrabold leading-tight md:text-5xl">
          أكل بيتي زي بتاع ماما
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-white/90">
          اختار الأيام اللي عايز تطلب فيها، وبعدين وجباتك وإضافاتك لكل يوم.
        </p>
        <Button as="a" href="#days" variant="secondary" size="lg" className="mt-7">
          اختار أيامك
        </Button>
      </div>
    </section>
  );
}

/* ═══════════════ Home ═══════════════ */
export default function Home() {
  const { data: days, isLoading, isError, refetch } = useQuery({
    queryKey: ["upcoming"],
    queryFn: menuApi.getUpcoming,
  });

  const selectedDates = useCartStore((s) => s.selectedDates);
  const items = useCartStore((s) => s.items);
  const toggleDate = useCartStore((s) => s.toggleDate);
  const pruneInvalid = useCartStore((s) => s.pruneInvalid);

  // أكورديون مفتوح
  const [openAccordion, setOpenAccordion] = useState(null);
  // شيت الإضافات
  const [addonsState, setAddonsState] = useState({ open: false, meal: null, date: null });
  // درور السلة
  const [cartOpen, setCartOpen] = useState(false);
  // مودال تأكيد حذف يوم
  const [removeConfirm, setRemoveConfirm] = useState(null);

  // Prune invalid items on load
  useEffect(() => {
    if (days) pruneInvalid(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

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

      {/* ═══ اختار أيامك ═══ */}
      <section id="days" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
        <h2 className="text-2xl font-extrabold md:text-3xl">اختار أيامك</h2>
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
        <section className="mx-auto max-w-6xl px-4 pb-10">
          <h2 className="mb-4 text-xl font-extrabold md:text-2xl">
            وجبات الأيام المختارة
          </h2>
          <div className={`space-y-3 ${hasItems ? "pb-24 md:pb-20" : ""}`}>
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

      {/* ═══ درور السلة ═══ */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {/* ═══ بار السلة اللاصق ═══ */}
      <StickyCartBar onOpen={() => setCartOpen(true)} />

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
