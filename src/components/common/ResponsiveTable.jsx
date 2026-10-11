import { cn } from "@/lib/cn";
import Reveal from "./Reveal";

/**
 * لاب توب: جدول عادي. موبايل: كروت (بدل ما نصغّر الجدول).
 * columns: [{ key, header, render?(row), className?, headerClassName?, hideOnCard? }]
 * renderCard?(row): كارت مخصص للموبايل (اختياري)
 * الصفوف والكروت بتدخل بتتابع خفيف أول مرة بس (Reveal)
 */
export default function ResponsiveTable({ columns, rows, rowKey = "id", onRowClick, renderCard, empty = "مفيش بيانات" }) {
  if (!rows?.length) {
    return <div className="rounded-3xl bg-white p-10 text-center text-ink-soft shadow-soft">{empty}</div>;
  }
  const cell = (c, row) => (c.render ? c.render(row) : row[c.key]);
  const [first, ...rest] = columns;
  const onKey = (e, row) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick?.(row); }
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto rounded-3xl bg-white text-ink shadow-soft md:block">
        <table className="w-full text-start">
          <thead className="bg-cream-dark text-sm text-ink-soft">
            <tr>{columns.map((c) => <th key={c.key} className={cn("px-5 py-3 text-start font-semibold", c.headerClassName)}>{c.header}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <Reveal as="tr" index={i} key={row[rowKey]} onClick={() => onRowClick?.(row)}
                className={cn("border-t border-ink/5", onRowClick && "cursor-pointer hover:bg-brand-yellow-soft/40")}>
                {columns.map((c) => <td key={c.key} className={cn("px-5 py-4", c.className)}>{cell(c, row)}</td>)}
              </Reveal>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row, i) => (
          <Reveal as="li" index={i} key={row[rowKey]}>
            <div role={onRowClick ? "button" : undefined} tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(row)}
              onKeyDown={onRowClick ? (e) => onKey(e, row) : undefined}
              className={cn("block w-full rounded-3xl bg-white p-4 text-start text-ink shadow-soft",
                onRowClick && "cursor-pointer")}>
              {renderCard ? renderCard(row) : (
                <>
                  <div className="mb-2 text-lg font-bold">{cell(first, row)}</div>
                  <dl className="space-y-1.5 text-sm">
                    {rest.filter((c) => !c.hideOnCard).map((c) => (
                      <div key={c.key} className="flex items-center justify-between gap-3">
                        <dt className="text-ink-soft">{c.header}</dt><dd className="min-w-0 font-semibold">{cell(c, row)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
