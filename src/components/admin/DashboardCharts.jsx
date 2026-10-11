import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BRAND_COLORS as C, withAlpha } from "@/lib/brandColors";
import { formatDayLabel } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * شارتس لوحة التحكم (recharts — بيتحمّل مع صفحة الداشبورد بس).
 * كل شارت سلسلة واحدة => من غير legend (العنوان بيقول هي إيه)، والكلام بلون الكلام مش لون السلسلة.
 * الـ SVG نفسه LTR (محاذاة نصوص recharts بتبوظ مع direction: rtl) والمحاور معكوسة
 * => الأحد على اليمين والقيم من اليمين، زي القراءة بالعربي.
 */
const FONT = "Cairo, system-ui, sans-serif";
const TICK = { fill: C.inkSoft, fontSize: 12, fontFamily: FONT };
const GRID = withAlpha(C.ink, 0.08);
const CURSOR = { fill: withAlpha(C.ink, 0.05) };
const shortDay = (name) => name.replace(/^ال/, ""); // "الأربعاء" => "أربعاء" عشان 7 أيام يكفوا على 320px
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const MEAL_NAME_MAX = 12;
const truncate = (s) => (s.length > MEAL_NAME_MAX ? `${s.slice(0, MEAL_NAME_MAX - 1)}…` : s);

function Frame({ height = 240, children }) {
  return (
    <div dir="ltr" className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}

/** تولتيب RTL موحد (recharts بيمرر active و payload) */
function TooltipBox({ active, payload, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-2xl bg-ink px-3 py-2 text-start text-sm text-white shadow-soft">
      {render(payload[0].payload)}
    </div>
  );
}

const dayTooltip = (value) =>
  function DayTooltip(d) {
    return (
      <>
        <p className="font-bold">{formatDayLabel(d.date)}</p>
        <p className="text-white/80">{value(d)}</p>
      </>
    );
  };

/** الطلبات كل يوم في الأسبوع (أعمدة) */
export function OrdersPerDayChart({ days }) {
  const reduced = useReducedMotion();
  return (
    <Frame>
      <BarChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="dayName" reversed interval="preserveStartEnd" minTickGap={4} tickFormatter={shortDay} tick={TICK} tickLine={false} axisLine={false} />
        <YAxis orientation="right" allowDecimals={false} width={32} tick={TICK} tickLine={false} axisLine={false} />
        <Tooltip cursor={CURSOR} content={<TooltipBox render={dayTooltip((d) => `${d.orders} طلب`)} />} />
        <Bar dataKey="orders" fill={C.red} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={!reduced} />
      </BarChart>
    </Frame>
  );
}

/** الإيرادات كل يوم في الأسبوع (مساحة بني) */
export function RevenuePerDayChart({ days }) {
  const reduced = useReducedMotion();
  return (
    <Frame>
      <AreaChart data={days} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        {/* padding: أول وآخر نقطة (واسم يومهم) ما يتقصوش على الطرف */}
        <XAxis dataKey="dayName" reversed interval="preserveStartEnd" minTickGap={4} padding={{ left: 16, right: 16 }} tickFormatter={shortDay} tick={TICK} tickLine={false} axisLine={false} />
        <YAxis orientation="right" allowDecimals={false} width={44} tickFormatter={(v) => compact.format(v)} tick={TICK} tickLine={false} axisLine={false} />
        <Tooltip cursor={{ stroke: withAlpha(C.ink, 0.3) }} content={<TooltipBox render={dayTooltip((d) => formatPrice(d.revenue))} />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={C.ink}
          strokeWidth={2}
          fill={withAlpha(C.ink, 0.08)}
          dot={{ r: 4, fill: C.ink, stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 6, fill: C.ink, stroke: "#fff", strokeWidth: 2 }}
          isAnimationActive={!reduced}
        />
      </AreaChart>
    </Frame>
  );
}

/** اسم الوجبة على المحور: مقصوص لو طويل، والاسم كامل في الـ title والتولتيب */
function MealTick({ x, y, payload }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="start" fill={C.ink} fontSize={13} fontWeight={600} fontFamily={FONT}>
      <title>{payload.value}</title>
      {truncate(payload.value)}
    </text>
  );
}

/** الكمية جنب آخر العمود. المحور معكوس فعرض العمود بيطلع سالب => بنحسب الطرف الشمال بنفسنا */
function QuantityLabel({ x, y, width, height, value }) {
  return (
    <text x={Math.min(x, x + width) - 6} y={y + height / 2} dy={4} textAnchor="end" fill={C.ink} fontSize={12} fontWeight={700} fontFamily={FONT}>
      {value}
    </text>
  );
}

/** الأكتر مبيعاً (أعمدة أفقية، توب 5 بالكمية) */
export function TopMealsChart({ meals }) {
  const reduced = useReducedMotion();
  return (
    <Frame height={Math.max(160, meals.length * 48)}>
      <BarChart layout="vertical" data={meals} margin={{ top: 0, right: 0, bottom: 0, left: 32 }} barCategoryGap={10}>
        <XAxis type="number" hide reversed allowDecimals={false} />
        <YAxis type="category" dataKey="name" orientation="right" width={112} tick={<MealTick />} tickLine={false} axisLine={false} />
        <Tooltip cursor={CURSOR} content={<TooltipBox render={(m) => (<><p className="font-bold">{m.name}</p><p className="text-white/80">{m.quantity} وجبة</p></>)} />} />
        <Bar dataKey="quantity" fill={C.red} radius={[4, 0, 0, 4]} maxBarSize={28} isAnimationActive={!reduced}>
          <LabelList dataKey="quantity" content={<QuantityLabel />} />
        </Bar>
      </BarChart>
    </Frame>
  );
}
