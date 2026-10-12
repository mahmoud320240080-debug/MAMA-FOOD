import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import BottomSheet from "@/components/common/BottomSheet";
import Button from "@/components/common/Button";
import SearchInput from "@/components/common/SearchInput";
import FilterChips from "./FilterChips";
import { cn } from "@/lib/cn";

const defaultOf = (f) => f.defaultValue ?? "";
const optionText = (o) => (o.count != null ? `${o.label} (${o.count})` : o.label);

/** فلتر واحد كـ select صغير (الديسكتوب) — بإطار أحمر لو مش على القيمة الافتراضية */
function FilterSelect({ filter, value, onChange }) {
  return (
    <div className="relative">
      <select
        aria-label={filter.label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-h-[44px] max-w-[15rem] cursor-pointer appearance-none truncate rounded-full border-2 bg-white pe-9 ps-4 text-sm font-bold text-ink transition focus:border-brand-red focus:outline-none",
          value !== defaultOf(filter) ? "border-brand-red" : "border-ink/10 hover:border-brand-red/50"
        )}
      >
        {filter.options.map((o) => <option key={o.value || "all"} value={o.value}>{optionText(o)}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
    </div>
  );
}

/**
 * شريط البحث والفلاتر لقوايم الأدمن + سطر "N نتيجة" و"مسح الفلاتر".
 * من 768px: البحث وكل الفلاتر (select لكل واحد) في صف واحد بيلف لو مفيش مكان.
 * أقل من 768px: البحث باين، وباقي الفلاتر في زرار "فلتر" (عليه عدد الفلاتر الشغالة) بيفتح BottomSheet
 * فيه نفس الفلاتر شرايح، و"تطبيق" / "مسح".
 *
 * filters: [{ key, label, options: [{ value, label, count? }], defaultValue = "", counted = true }]
 *   (options بتبدأ بالقيمة الافتراضية زي "الكل"؛ counted: false = مش بيتعد في البادج زي الترتيب)
 * values: { [key]: value } | onChange(patch): تغيير فلتر أو أكتر مرة واحدة
 * search: { value, onChange, label, placeholder } | resultLabel: "12 طلب" | onClearAll: مسح البحث والفلاتر
 */
export default function FilterBar({ search, filters, values, onChange, resultLabel, onClearAll }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState({});

  const activeCount = filters.filter((f) => f.counted !== false && values[f.key] !== defaultOf(f)).length;
  const canClear = !!search.value || filters.some((f) => values[f.key] !== defaultOf(f));

  const openSheet = () => {
    setDraft(Object.fromEntries(filters.map((f) => [f.key, values[f.key]])));
    setSheetOpen(true);
  };
  const applyDraft = (next) => {
    const patch = Object.fromEntries(filters.filter((f) => next[f.key] !== values[f.key]).map((f) => [f.key, next[f.key]]));
    if (Object.keys(patch).length) onChange(patch);
    setSheetOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 md:flex-wrap">
        <SearchInput
          value={search.value}
          onChange={search.onChange}
          label={search.label}
          placeholder={search.placeholder}
          className="min-w-0 flex-1 md:w-72 md:flex-none lg:w-80"
        />

        {filters.length > 0 && (
          <>
            <button
              type="button"
              onClick={openSheet}
              className={cn(
                "inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-2xl border-2 bg-white px-3.5 text-sm font-bold text-ink transition md:hidden",
                activeCount ? "border-brand-red" : "border-ink/10"
              )}
            >
              <SlidersHorizontal className="h-5 w-5" aria-hidden />
              فلتر
              {activeCount > 0 && (
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-red px-1 text-xs text-white">
                  {activeCount}
                  <span className="sr-only"> فلتر شغال</span>
                </span>
              )}
            </button>
            <div className="hidden md:contents">
              {filters.map((f) => (
                <FilterSelect key={f.key} filter={f} value={values[f.key]} onChange={(v) => onChange({ [f.key]: v })} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink-soft" aria-live="polite">{resultLabel}</p>
        {canClear && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            <X className="h-4 w-4" aria-hidden />
            مسح الفلاتر
          </Button>
        )}
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="الفلاتر"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" block onClick={() => applyDraft(Object.fromEntries(filters.map((f) => [f.key, defaultOf(f)])))}>
              مسح
            </Button>
            <Button block onClick={() => applyDraft(draft)}>تطبيق</Button>
          </div>
        }
      >
        <div className="space-y-5 pb-2">
          {filters.map((f) => (
            <fieldset key={f.key} className="min-w-0">
              <legend className="mb-2 text-sm font-extrabold">{f.label}</legend>
              <FilterChips
                label={f.label}
                options={f.options}
                value={draft[f.key] ?? defaultOf(f)}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            </fieldset>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
