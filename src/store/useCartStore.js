import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateLineId } from "@/lib/cart";
import { toast } from "@/store/useToastStore";

/**
 * @typedef {{ id: string, name: string, price: number }} Addon
 * @typedef {{ id: string, date: string, mealId: string, name: string, price: number, quantity: number, addons: Addon[], note: string }} CartItem
 * @typedef {{ name: string, phone: string, address: string, notes: string }} Customer
 */

export const useCartStore = create(
  persist(
    (set, get) => ({
      /** @type {string[]} */
      selectedDates: [],
      /** @type {CartItem[]} */
      items: [],
      /** @type {Customer} */
      customer: { name: "", phone: "", address: "", notes: "", deliveryAreaId: "" },
      /** @type {CartItem|null} */
      _lastRemoved: null,
      /** آخر طريقة دفع اختارها الزبون (بتتحفظ بعد الطلب زي بياناته) */
      paymentMethod: "cash",

      // — أيام —
      toggleDate: (date) => {
        const { selectedDates } = get();
        if (selectedDates.includes(date)) {
          // الشيل بيتم بعد تأكيد (المكون هيعرض Modal)
          set({
            selectedDates: selectedDates.filter((d) => d !== date),
            items: get().items.filter((it) => it.date !== date),
          });
        } else {
          set({ selectedDates: [...selectedDates, date].sort() });
        }
      },
      setSelectedDates: (dates) => set({ selectedDates: [...dates].sort() }),
      removeDateItems: (date) =>
        set({ items: get().items.filter((it) => it.date !== date) }),
      /** شيل يوم بالكامل (وجباته + اختياره) — لما اليوم يتقفل والزبون لسه بيطلب */
      removeDay: (date) =>
        set({
          items: get().items.filter((it) => it.date !== date),
          selectedDates: get().selectedDates.filter((d) => d !== date),
        }),

      // — عناصر —
      addItem: ({ date, mealId, name, price, addons = [], note = "", quantity = 1 }) => {
        const lineId = generateLineId(date, mealId, addons, note);
        const items = get().items;
        const existing = items.find((it) => it.id === lineId);
        if (existing) {
          set({ items: items.map((it) => (it.id === lineId ? { ...it, quantity: it.quantity + quantity } : it)) });
        } else {
          set({ items: [...items, { id: lineId, date, mealId, name, price, quantity, addons, note }] });
        }
        // تأكد إن اليوم محدد
        const { selectedDates } = get();
        if (!selectedDates.includes(date)) {
          set({ selectedDates: [...selectedDates, date].sort() });
        }
      },

      updateQuantity: (lineId, qty) => {
        if (qty < 1) return get().removeItem(lineId);
        set({ items: get().items.map((it) => (it.id === lineId ? { ...it, quantity: qty } : it)) });
      },

      removeItem: (lineId) => {
        const item = get().items.find((it) => it.id === lineId);
        set({
          items: get().items.filter((it) => it.id !== lineId),
          _lastRemoved: item || null,
        });
        if (item) {
          toast.info(`تم حذف ${item.name}`, {
            ms: 5000,
            action: {
              label: "تراجع",
              onClick: () => get().undoRemove(),
            },
          });
        }
      },

      undoRemove: () => {
        const item = get()._lastRemoved;
        if (!item) return;
        const { items, selectedDates } = get();
        const nextDates = selectedDates.includes(item.date)
          ? selectedDates
          : [...selectedDates, item.date].sort();
        set({ items: [...items, item], selectedDates: nextDates, _lastRemoved: null });
        toast.success("تم إرجاع العنصر");
      },

      clearCart: () => set({ selectedDates: [], items: [], _lastRemoved: null }),

      saveCustomer: (c) => set({ customer: { ...get().customer, ...c } }),
      savePaymentMethod: (paymentMethod) => set({ paymentMethod }),

      /**
       * إزالة العناصر اللي يومها اتقفل أو مش في الأيام الجاية.
       * بيترحل عند فتح الصفحة.
       */
      pruneInvalid: (upcomingDays) => {
        const validDates = new Set(upcomingDays.filter((d) => !d.isClosed).map((d) => d.date));
        const allDates = new Set(upcomingDays.map((d) => d.date));
        const { items, selectedDates } = get();

        const prunedItems = items.filter((it) => validDates.has(it.date));
        const removedCount = items.length - prunedItems.length;

        const prunedDates = selectedDates.filter((d) => allDates.has(d) && validDates.has(d));

        if (removedCount > 0) {
          toast.info(`تم إزالة ${removedCount} عنصر لأن يومهم اتقفل أو مش متاح`);
        }

        set({ items: prunedItems, selectedDates: prunedDates });
      },
    }),
    {
      name: "mamafood:cart",
      partialize: (state) => ({
        selectedDates: state.selectedDates,
        items: state.items,
        customer: state.customer,
        paymentMethod: state.paymentMethod,
      }),
    }
  )
);
