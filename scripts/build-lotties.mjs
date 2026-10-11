/**
 * بيولّد أنيميشنات Lottie بسيطة بألوان MAMA FOOD (رسم أصلي للمشروع — راجع CREDITS.md).
 * التشغيل: node scripts/build-lotties.mjs  => src/assets/lottie/*.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BRAND_COLORS as B } from "../src/lib/brandColors.js";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/assets/lottie");
fs.mkdirSync(OUT, { recursive: true });

// ── ألوان الهوية (0..1) — من نفس ملف ألوان الموقع ──
const hex = (h) => [1, 3, 5].map((i) => +(parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).concat(1);
const C = { red: hex(B.red), redDark: hex(B.redDark), yellow: hex(B.yellow), ink: hex(B.ink), cream: hex(B.cream), creamDark: hex(B.creamDark), white: hex("#FFFFFF") };

const FR = 30, OP = 90; // 3 ثواني لوب
const ease = { i: { x: 0.45, y: 1 }, o: { x: 0.55, y: 0 } };
const K = (v) => ({ a: 0, k: v });
/** خصائص متحركة: [[frame, value], ...] — أول وآخر قيمة نفس الحاجة عشان اللوب يبقى ناعم */
const A = (frames) => ({
  a: 1,
  k: frames.map(([t, v], i) => (i < frames.length - 1 ? { t, s: [].concat(v), ...ease } : { t, s: [].concat(v) })),
});

const tr = ({ p = [0, 0], a = [0, 0], s = [100, 100], r = 0, o = 100 } = {}) => ({
  ty: "tr", p: p.a ? p : K(p), a: a.a ? a : K(a), s: s.a ? s : K(s), r: r.a ? r : K(r), o: o.a ? o : K(o), sk: K(0), sa: K(0),
});
const fill = (c, o = 100) => ({ ty: "fl", c: K(c), o: K(o), r: 1 });
const stroke = (c, w, o = 100) => ({ ty: "st", c: K(c), o: K(o), w: K(w), lc: 2, lj: 2 });
const rect = (w, h, r = 0, p = [0, 0]) => ({ ty: "rc", d: 1, s: K([w, h]), p: K(p), r: K(r) });
const ellipse = (w, h, p = [0, 0]) => ({ ty: "el", d: 1, s: K([w, h]), p: K(p) });
/** مسار: نقط + مقابض (in/out) نسبية */
const pathShape = (v, i, o, closed = false) => ({ ty: "sh", ks: K({ v, i: i || v.map(() => [0, 0]), o: o || v.map(() => [0, 0]), c: closed }) });
const trim = (e, s = K(0)) => ({ ty: "tm", s, e: e.a ? e : K(e), o: K(0), m: 1 });
const group = (items, t = {}) => ({ ty: "gr", it: [...items, tr(t)] });

let ind = 0;
const layer = (name, shapes, ks = {}) => ({
  ddd: 0, ind: ++ind, ty: 4, nm: name, sr: 1, ao: 0, bm: 0, ip: 0, op: OP, st: 0,
  ks: {
    o: ks.o ? (ks.o.a ? ks.o : K(ks.o)) : K(100),
    r: ks.r ? (ks.r.a ? ks.r : K(ks.r)) : K(0),
    p: ks.p ? (ks.p.a ? ks.p : K(ks.p)) : K([100, 100, 0]),
    a: ks.a ? K(ks.a) : K([0, 0, 0]),
    s: ks.s ? (ks.s.a ? ks.s : K(ks.s)) : K([100, 100, 100]),
  },
  shapes,
});
const doc = (name, layers) => ({ v: "5.7.4", fr: FR, ip: 0, op: OP, w: 200, h: 200, nm: name, ddd: 0, assets: [], layers });

/** قبعة الشيف (زي اللي في لوجو الـ M): 3 دواير منفوخة + جسم + شريط */
const chefHat = (top, band, outline) => [
  group([ellipse(30, 30, [-15, -4]), ellipse(36, 36, [0, -12]), ellipse(30, 30, [15, -4]), rect(40, 22, 4, [0, 8]), fill(top), ...(outline ? [stroke(outline, 4)] : [])]),
  group([rect(42, 10, 4, [0, 22]), fill(band)]),
];

const sparkle = (name, x, y, delay, c) => layer(name, [group([ellipse(10, 10), fill(c)])], {
  p: A([[delay, [x, y + 10, 0]], [delay + 30, [x, y - 14, 0]]]),
  o: A([[0, 0], [delay, 0], [delay + 12, 100], [delay + 30, 0], [OP, 0]]),
  s: A([[delay, [60, 60, 100]], [delay + 15, [110, 110, 100]], [delay + 30, [70, 70, 100]]]),
});

const files = {};

// 1) السلة فاضية: شنطة حمرا بتتمرجح وعليها قبعة، ونجوم صفرا طالعة
ind = 0;
files["empty-cart"] = doc("empty-cart", [
  sparkle("spark1", 52, 70, 6, C.yellow),
  sparkle("spark2", 150, 58, 30, C.yellow),
  sparkle("spark3", 140, 100, 54, C.redDark),
  layer("bag", [
    group(chefHat(C.cream, C.yellow), { p: [0, 4], s: [62, 62] }),
    group([pathShape([[-22, -38], [0, -66], [22, -38]], [[0, 0], [-16, 0], [0, 14]], [[0, -14], [16, 0], [0, 0]]), stroke(C.redDark, 8)]),
    group([rect(92, 84, 18, [0, 4]), fill(C.red)]),
  ], { p: A([[0, [100, 126, 0]], [45, [100, 118, 0]], [90, [100, 126, 0]]]), r: A([[0, -5], [45, 5], [90, -5]]), a: [0, 40, 0] }),
  layer("shadow", [group([ellipse(96, 14), fill(C.ink, 12)])], { p: [100, 178, 0], s: A([[0, [100, 100, 100]], [45, [82, 82, 100]], [90, [100, 100, 100]]]) }),
]);

// 2) مفيش طلبات: كليب بورد والسطور بتتكتب
ind = 0;
const line = (y, w, delay) => group([pathShape([[-w / 2, y], [w / 2, y]]), stroke(C.ink, 7, 30), trim(A([[0, 0], [delay, 0], [delay + 18, 100], [75, 100], [OP, 0]]))]);
files["no-orders"] = doc("no-orders", [
  layer("check", [group([ellipse(34, 34), fill(C.yellow)]), group([pathShape([[-8, 0], [-2, 6], [9, -6]]), stroke(C.ink, 5)])], {
    p: [134, 138, 0],
    s: A([[0, [0, 0, 100]], [56, [0, 0, 100]], [64, [115, 115, 100]], [70, [100, 100, 100]], [80, [100, 100, 100]], [88, [0, 0, 100]], [90, [0, 0, 100]]]),
  }),
  layer("lines", [line(-22, 56, 4), line(-2, 56, 18), line(18, 38, 32)], { p: [100, 108, 0] }),
  layer("clip", [group([rect(48, 18, 8), fill(C.red)])], { p: [100, 52, 0] }),
  layer("board", [group([rect(112, 138, 16), fill(C.white), stroke(C.ink, 6)])], {
    p: A([[0, [100, 106, 0]], [45, [100, 101, 0]], [90, [100, 106, 0]]]),
  }),
]);

// 3) مفيش وجبات لليوم: حلة والبخار طالع
ind = 0;
const steam = (x, delay) => layer("steam" + x, [group([
  pathShape([[0, 0], [0, -20], [0, -40]], [[0, 0], [8, 6], [-8, 6]], [[8, -6], [-8, -6], [0, 0]]), stroke(C.ink, 6, 35),
])], {
  p: A([[0, [x, 92, 0]], [delay, [x, 92, 0]], [delay + 40, [x, 70, 0]], [OP, [x, 70, 0]]]),
  o: A([[0, 0], [delay, 0], [delay + 12, 100], [delay + 40, 0], [OP, 0]]),
});
files["no-meals"] = doc("no-meals", [
  steam(78, 0), steam(100, 20), steam(122, 40),
  layer("pot", [
    group([rect(108, 10, 5, [0, -40]), fill(C.redDark)]),
    group([ellipse(18, 10, [0, -50]), fill(C.redDark)]),
    group([rect(20, 10, 5, [-62, -14]), fill(C.redDark)]),
    group([rect(20, 10, 5, [62, -14]), fill(C.redDark)]),
    group([rect(104, 66, 18, [0, -2]), fill(C.red)]),
    group([rect(40, 6, 3, [0, -10]), fill(C.cream, 70)]),
  ], { p: A([[0, [100, 140, 0]], [45, [100, 137, 0]], [90, [100, 140, 0]]]) }),
  layer("shadow", [group([ellipse(120, 12), fill(C.ink, 12)])], { p: [100, 178, 0] }),
]);

// 4) مفيش نتايج بحث: عدسة بتدوّر يمين وشمال
ind = 0;
files["no-results"] = doc("no-results", [
  layer("glass", [
    group([ellipse(14, 22, [-12, -12]), fill(C.white, 80)], { r: 35 }),
    group([ellipse(64, 64), stroke(C.ink, 10)]),
    group([ellipse(64, 64), fill(C.creamDark)]),
    group([rect(16, 46, 8, [0, 0]), fill(C.red)], { p: [34, 34], r: -45 }),
  ], {
    p: A([[0, [92, 92, 0]], [22, [116, 84, 0]], [45, [108, 108, 0]], [68, [84, 100, 0]], [90, [92, 92, 0]]]),
    r: A([[0, 0], [22, 10], [45, 0], [68, -10], [90, 0]]),
  }),
  layer("shadow", [group([ellipse(90, 12), fill(C.ink, 10)])], { p: [100, 172, 0] }),
]);

// 5) 404: قبعة الشيف بتتنطط وعلامة استفهام
ind = 0;
files["not-found"] = doc("not-found", [
  layer("question", [
    group([ellipse(9, 9, [0, 22]), fill(C.red)]),
    group([pathShape([[-12, -10], [0, -22], [12, -10], [0, 6]], [[0, 0], [-10, 0], [0, -8], [0, -6]], [[0, -8], [10, 0], [0, 6], [0, 0]]), stroke(C.red, 7)]),
  ], {
    p: [146, 72, 0],
    r: A([[0, -8], [45, 8], [90, -8]]),
    o: A([[0, 100], [45, 70], [90, 100]]),
  }),
  layer("hat", chefHat(C.white, C.red, C.ink), {
    p: A([[0, [92, 124, 0]], [20, [92, 100, 0]], [40, [92, 124, 0]], [48, [92, 118, 0]], [56, [92, 124, 0]], [90, [92, 124, 0]]]),
    r: A([[0, -6], [20, 6], [40, -6], [90, -6]]),
    s: A([[0, [150, 150, 100]], [38, [150, 150, 100]], [41, [160, 138, 100]], [46, [150, 150, 100]], [90, [150, 150, 100]]]),
    a: [0, 30, 0],
  }),
  layer("shadow", [group([ellipse(84, 12), fill(C.ink, 12)])], { p: [92, 172, 0], s: A([[0, [100, 100, 100]], [20, [70, 70, 100]], [40, [100, 100, 100]], [90, [100, 100, 100]]]) }),
]);

for (const [name, data] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify(data));
  console.log(`${name}.json  ${(JSON.stringify(data).length / 1024).toFixed(1)} KB`);
}
