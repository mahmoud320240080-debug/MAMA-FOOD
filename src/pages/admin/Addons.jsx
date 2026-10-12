import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, Link2, AlertTriangle } from "lucide-react";
import { addonsApi, mealsApi } from "@/api";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Skeleton from "@/components/common/Skeleton";
import ResponsiveTable from "@/components/common/ResponsiveTable";
import AddonForm from "@/components/admin/AddonForm";
import FilterBar from "@/components/admin/FilterBar";
import { EmptyState, PageError } from "@/components/admin/PageState";
import { formatPrice } from "@/lib/format";
import { ADDON_PRICES, filterAddons } from "@/lib/filters";
import { toast } from "@/store/useToastStore";
import { cn } from "@/lib/cn";

const NO_FILTERS = { q: "", price: "" };

function PriceTag({ price }) {
  if (price === 0) {
    return <span className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold text-ink">مجاني</span>;
  }
  return <span className="font-extrabold text-brand-red [overflow-wrap:anywhere]">{formatPrice(price)}</span>;
}

function LinkedMeals({ count }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", count ? "font-semibold" : "text-ink-soft")}>
      <Link2 className="h-4 w-4 shrink-0" aria-hidden />
      {count ? `مربوطة بـ ${count} وجبة` : "مش مربوطة بوجبات"}
    </span>
  );
}

function RowActions({ addon, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onEdit(addon)}
        aria-label={`تعديل ${addon.name}`}
        className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-ink/10"
      >
        <Edit2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onDelete(addon)}
        aria-label={`حذف ${addon.name}`}
        className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition hover:bg-brand-red hover:text-white"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export default function Addons() {
  const queryClient = useQueryClient();
  const [formModal, setFormModal] = useState({ open: false, addon: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState(NO_FILTERS);

  const addonsQuery = useQuery({ queryKey: ["addons"], queryFn: addonsApi.list });
  const mealsQuery = useQuery({ queryKey: ["meals"], queryFn: mealsApi.list });
  const addons = useMemo(() => addonsQuery.data ?? [], [addonsQuery.data]);
  const filteredAddons = useMemo(() => filterAddons(addons, filters), [addons, filters]);
  const updateFilters = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const priceFilter = useMemo(() => {
    const base = filterAddons(addons, { ...filters, price: "" });
    return [{
      key: "price", label: "السعر",
      options: [
        { value: "", label: "الكل", count: base.length },
        ...Object.entries(ADDON_PRICES).map(([value, label]) => ({ value, label, count: filterAddons(base, { price: value }).length })),
      ],
    }];
  }, [addons, filters]);

  // الوجبات المربوطة بكل إضافة
  const mealsByAddon = useMemo(() => {
    const map = new Map();
    for (const meal of mealsQuery.data ?? []) {
      for (const a of meal.addons || []) {
        const id = typeof a === "object" ? a.id : a;
        map.set(id, [...(map.get(id) || []), meal]);
      }
    }
    return map;
  }, [mealsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id) => addonsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      toast.success(`تم حذف "${deleteTarget?.name}"`);
      setDeleteTarget(null);
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة أثناء حذف الإضافة"),
  });

  const openCreate = () => setFormModal({ open: true, addon: null });
  const openEdit = (addon) => setFormModal({ open: true, addon });

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold md:text-3xl">الإضافات</h1>
        <p className="mt-1 text-sm text-ink-soft">
          الإضافات اللي الزبون يقدر يختارها مع الوجبات (سلطة، صوص، عيش زيادة...).
        </p>
      </div>
      <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
        <Plus className="h-5 w-5" aria-hidden />
        إضافة جديدة
      </Button>
    </div>
  );

  if (addonsQuery.isLoading || mealsQuery.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-40 rounded-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (addonsQuery.isError || mealsQuery.isError) {
    return (
      <PageError
        title="تعذر تحميل الإضافات"
        error={addonsQuery.error || mealsQuery.error}
        onRetry={() => { addonsQuery.refetch(); mealsQuery.refetch(); }}
      />
    );
  }

  const columns = [
    {
      key: "name",
      header: "الإضافة",
      render: (a) => <span className="block max-w-md font-bold [overflow-wrap:anywhere]">{a.name}</span>,
    },
    { key: "price", header: "السعر", render: (a) => <PriceTag price={a.price} /> },
    { key: "meals", header: "الوجبات", render: (a) => <LinkedMeals count={mealsByAddon.get(a.id)?.length || 0} /> },
    {
      key: "actions",
      header: <span className="sr-only">إجراءات</span>,
      className: "w-px py-2",
      render: (a) => <RowActions addon={a} onEdit={openEdit} onDelete={setDeleteTarget} />,
    },
  ];

  const linkedToDelete = deleteTarget ? mealsByAddon.get(deleteTarget.id) || [] : [];

  return (
    <div className="space-y-6">
      {header}

      {addons.length === 0 ? (
        <EmptyState
          animation="noOrders"
          title="لسه مفيش إضافات"
          description="ضيف إضافات زي السلطة والصوصات، وبعدين اربطها بالوجبات من صفحة الوجبات."
          action={<Button variant="outline" onClick={openCreate}>ضيف أول إضافة</Button>}
        />
      ) : (
        <>
          <FilterBar
            search={{ value: filters.q, onChange: (q) => updateFilters({ q }), label: "بحث في الإضافات", placeholder: "اسم الإضافة" }}
            filters={priceFilter}
            values={filters}
            onChange={updateFilters}
            resultLabel={`${filteredAddons.length} إضافة`}
            onClearAll={() => setFilters(NO_FILTERS)}
          />
          {filteredAddons.length === 0 ? (
            <EmptyState
              animation="noResults"
              title="مفيش نتايج"
              description="جرّب كلمة بحث تانية أو غيّر الفلتر."
              action={<Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>مسح الفلاتر</Button>}
            />
          ) : (
            <ResponsiveTable
              columns={columns}
              rows={filteredAddons}
              onRowClick={openEdit}
              renderCard={(a) => (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 text-base font-extrabold [overflow-wrap:anywhere]">{a.name}</h3>
                    <span className="max-w-[45%] shrink-0 text-end"><PriceTag price={a.price} /></span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-ink/10 pt-2">
                    <LinkedMeals count={mealsByAddon.get(a.id)?.length || 0} />
                    <RowActions addon={a} onEdit={openEdit} onDelete={setDeleteTarget} />
                  </div>
                </>
              )}
            />
          )}
        </>
      )}

      {formModal.open && (
        <AddonForm
          open
          addon={formModal.addon}
          addons={addons}
          onClose={() => setFormModal({ open: false, addon: null })}
        />
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="حذف الإضافة"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" block onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              إلغاء
            </Button>
            <Button variant="danger" block loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteTarget.id)} className="whitespace-nowrap !px-4">
              نعم، احذف
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-ink">
          <p className="font-semibold leading-relaxed [overflow-wrap:anywhere]">
            متأكد إنك عايز تحذف <strong className="text-brand-red">&quot;{deleteTarget?.name}&quot;</strong>؟
          </p>
          {linkedToDelete.length > 0 && (
            <div className="rounded-2xl bg-brand-yellow-soft p-3">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                مربوطة بـ {linkedToDelete.length} وجبة
              </p>
              <p className="mt-1 [overflow-wrap:anywhere]">{linkedToDelete.map((m) => m.name).join("، ")}</p>
              <p className="mt-1 text-ink-soft">هتتشال من الوجبات دي.</p>
            </div>
          )}
          <p className="text-ink-soft">الطلبات القديمة مش هتتأثر وهتفضل ظاهرة فيها.</p>
        </div>
      </Modal>
    </div>
  );
}
