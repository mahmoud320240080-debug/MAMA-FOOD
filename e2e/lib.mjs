import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

export const BASE = process.env.E2E_BASE_URL || "http://localhost:5199";
export const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots");
fs.mkdirSync(SHOTS, { recursive: true });

/** مسار كروم/إيدج المتسطب على الجهاز (أو CHROME_PATH) */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error("مش لاقي Chrome. حدد المسار في CHROME_PATH");
  return found;
}

export async function launch() {
  return puppeteer.launch({ executablePath: findChrome(), headless: true, args: ["--lang=ar", "--no-first-run"] });
}

/** يجمع أخطاء وتحذيرات الكونسول */
export function watchConsole(page, bucket) {
  page.on("console", (m) => {
    const t = m.type();
    if (t === "error" || t === "warning" || t === "warn") {
      const text = m.text();
      // تحذيرات React Router v7 future flags موجودة من قبل ومش أخطاء
      if (/React Router Future Flag Warning/.test(text)) return;
      if (/Download the React DevTools/.test(text)) return;
      // تنبيه dev-only من Framer Motion لما الجهاز عليه "تقليل الحركة" (مش بيظهر في الـ production build)
      if (/You have Reduced Motion enabled on your device/.test(text)) return;
      bucket.push(`[${t}] ${page.url()} :: ${text}`);
    }
  });
  page.on("pageerror", (e) => bucket.push(`[pageerror] ${page.url()} :: ${e.message}`));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** كليك على أول عنصر (selector) نصه بيحتوي text وظاهر */
export async function clickText(page, selector, text, { root = "document", nth = 0 } = {}) {
  const ok = await page.evaluate((selector, text, root, nth) => {
    const scope = root === "dialog" ? [...document.querySelectorAll('[role="dialog"]')].pop() : document;
    const els = [...scope.querySelectorAll(selector)].filter((e) => e.textContent.includes(text) && e.offsetParent !== null);
    const el = els[nth];
    if (!el) return false;
    el.scrollIntoView({ block: "center" });
    el.click();
    return true;
  }, selector, text, root, nth);
  if (!ok) throw new Error(`clickText: not found ${selector} "${text}"`);
}

export async function waitText(page, text, timeout = 5000) {
  await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text);
}

export const ls = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
export const setLs = (page, key, v) => page.evaluate((k, v) => localStorage.setItem(k, JSON.stringify(v)), key, v);

export async function adminLogin(page) {
  await page.goto(`${BASE}/admin/login`);
  await page.evaluate(() => localStorage.setItem("mamafood:admin", JSON.stringify({ state: { adminToken: "demo-token" }, version: 0 })));
}

/** نفس منطق الفورمات في التطبيق، مستقل عنه للتأكد */
const DAY = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const dayLabel = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAY[dt.getDay()]} ${new Intl.DateTimeFormat("ar-EG-u-nu-latn", { day: "numeric", month: "long" }).format(dt)}`;
};
export const price = (n) => `${Number(n).toLocaleString("en-US")} جنيه`;

/**
 * تباين النص (WCAG) لكل نص ظاهر جوه الدايلوج المفتوح أو الصفحة.
 * بيرجع العناصر اللي تباينها أقل من min (العناصر الـ disabled مستثناة).
 */
export const lowContrast = (page, min = 3) => page.evaluate((min) => {
  const rgba = (s) => { const v = (s.match(/[\d.]+/g) || []).map(Number); return [v[0] ?? 0, v[1] ?? 0, v[2] ?? 0, v[3] ?? 1]; };
  const blend = (top, under) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  // الخلفية الفعلية: دمج كل الخلفيات الشفافة من العنصر لحد الجذر
  const bgOf = (el) => {
    const layers = [];
    for (let p = el; p; p = p.parentElement) { const c = rgba(getComputedStyle(p).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let acc = [255, 255, 255, 1];
    for (const c of layers.reverse()) acc = blend(c, acc);
    return acc;
  };
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const root = [...document.querySelectorAll('[role="dialog"]')].pop() || document.body;
  const bad = [];
  for (const el of root.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === "hidden" || el.closest(".sr-only, [disabled], [aria-hidden='true']")) continue;
    if (parseFloat(cs.opacity) < 1 && el.closest("button")) continue;
    const bg = bgOf(el);
    const fg = blend(rgba(cs.color), bg);
    const cr = ratio(fg, bg);
    if (cr < min) bad.push(`"${el.textContent.trim().slice(0, 24)}" ${cr.toFixed(2)}:1 (${cs.color} on rgb(${bg.slice(0, 3).map(Math.round)}))`);
  }
  return bad;
}, min);

/**
 * فحص الصفحة (أو آخر دايلوج مفتوح): سكرول أفقي، عناصر برا الشاشة أو برا الكارت، تاب تارجتس < 44،
 * أزرار متداخلة، أصفر على فاتح، RTL، جدول/كروت، ومقاس الدايلوج.
 */
export const auditPage = (page) => page.evaluate(() => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && !el.closest(".sr-only"); };
  const inScroller = (el, stop) => { for (let p = el.parentElement; p && p !== stop; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") return p; } return null; };
  const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${String(el.className).split(" ").slice(0, 3).join(".")} "${(el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 30)}"`;
  const dialog = [...document.querySelectorAll('[role="dialog"]')].pop();
  const root = dialog || document.body;
  const out = { hscroll: document.documentElement.scrollWidth > vw, scrollWidth: document.documentElement.scrollWidth, vw, offscreen: [], overflowCard: [], small: [], yellow: [], overlap: [] };

  const all = [...root.querySelectorAll("*")].filter(visible);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 0.5 || r.left < -0.5) && !inScroller(el, root.parentElement)) out.offscreen.push(desc(el));
    // جوه الكارت/الدايلوج
    const card = el.parentElement?.closest('.rounded-3xl, [role="dialog"], section');
    if (card && card !== el) {
      const c = card.getBoundingClientRect();
      const sc = inScroller(el, card);
      if (!sc && (r.right > c.right + 1 || r.left < c.left - 1)) out.overflowCard.push(desc(el));
    }
  }
  // تاب تارجتس
  const interactive = [...root.querySelectorAll('button, a[href], select, input:not([type="checkbox"]):not([type="radio"]), textarea, [role="button"], [role="tab"]')].filter(visible);
  for (const el of interactive) {
    const r = el.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) out.small.push(`${desc(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  // تداخل الأزرار
  // المحتوى اللي بيتسكرل تحت بار ثابت (ناف بار/دوك) مش تداخل — الـ padding بيضمن إنه يتوصله
  const pinned = (el) => { for (let p = el; p; p = p.parentElement) { const pos = getComputedStyle(p).position; if (pos === "fixed" || pos === "sticky") return true; } return false; };
  for (let i = 0; i < interactive.length; i++) for (let j = i + 1; j < interactive.length; j++) {
    const a = interactive[i], b = interactive[j];
    if (a.contains(b) || b.contains(a)) continue;
    if (pinned(a) !== pinned(b)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 2 && h > 2) out.overlap.push(`${desc(a)} <> ${desc(b)}`);
  }
  // أصفر على أبيض/كريمي
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const bgOf = (el) => { for (let p = el; p; p = p.parentElement) { const c = rgb(getComputedStyle(p).backgroundColor); if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c; } return [255, 255, 255]; };
  const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  for (const el of all) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const c = rgb(getComputedStyle(el).color);
    const isYellow = c[0] > 200 && c[1] > 180 && c[2] < 120;
    if (isYellow && lum(bgOf(el)) > 0.8) out.yellow.push(desc(el));
  }
  // RTL
  out.dir = document.documentElement.dir;
  const ths = [...document.querySelectorAll("main table th")].filter(visible);
  out.rtlTable = ths.length ? ths[0].getBoundingClientRect().right >= ths[ths.length - 1].getBoundingClientRect().right : null;
  const h1 = document.querySelector("main h1");
  const main = document.querySelector("main > div");
  out.rtlHeading = h1 && main ? Math.abs(h1.getBoundingClientRect().right - (main.getBoundingClientRect().right - parseFloat(getComputedStyle(main).paddingRight))) < 2 : null;
  out.tableVisible = [...document.querySelectorAll("main table")].some(visible);
  out.cardsVisible = [...document.querySelectorAll("main ul.md\\:hidden")].some(visible);
  out.chipRowsScroll = [...document.querySelectorAll('main [role="group"]')].filter(visible).map((g) => getComputedStyle(g).overflowX);
  if (dialog) { const r = dialog.getBoundingClientRect(); out.dialog = { w: Math.round(r.width), h: Math.round(r.height), vw, vh }; }
  return out;
});

/**
 * "مفيش dark mode": نفس الصفحة بـ prefers-color-scheme light و dark لازم تطلع نفس الصورة بالظبط.
 * بنوقف الحركة (reduced motion) ونخفي الكيرسر عشان الصورتين يتقارنوا byte-by-byte.
 */
export async function darkIdentical(page, { reduced = false, name = "state" } = {}) {
  const css = await page.addStyleTag({ content: "*{caret-color:transparent!important}" });
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "light" }]);
  await sleep(700);
  const a = await page.screenshot();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }, { name: "prefers-color-scheme", value: "dark" }]);
  await sleep(250);
  const b = await page.screenshot();
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: reduced ? "reduce" : "no-preference" }, { name: "prefers-color-scheme", value: "light" }]);
  await css.evaluate((el) => el.remove());
  // نفس الصورة تقريباً بكسل ببكسل: فرق أكبر من 4/255 مسموح في 25 بكسل بالكتير (ضوضاء anti-aliasing و blur الزجاج).
  // أي ستايل dark حقيقي (خلفية، نص، إنبوت، سكرول بار) بيغيّر آلاف البكسلات.
  const diff = await pixelDiff(page.browser(), a, b);
  const same = diff.significant <= 25;
  if (!same) { fs.writeFileSync(path.join(SHOTS, `dark-diff-${name}-light.png`), a); fs.writeFileSync(path.join(SHOTS, `dark-diff-${name}-dark.png`), b); }
  return same;
}

/** فرق البكسلات بين صورتين PNG: أقصى فرق في أي قناة لون + عدد البكسلات المختلفة */
export async function pixelDiff(browser, a, b) {
  const p = await browser.newPage();
  try {
    return await p.evaluate(async (a, b) => {
      const load = (src) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { max: 255, n: -1, significant: Infinity };
      const px = (img) => { const c = document.createElement("canvas"); c.width = img.width; c.height = img.height; const x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, img.width, img.height).data; };
      const da = px(ia), db = px(ib);
      let n = 0, max = 0, significant = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
        if (d) { n++; if (d > max) max = d; if (d > 4) significant++; }
      }
      return { max, n, significant };
    }, "data:image/png;base64," + Buffer.from(a).toString("base64"), "data:image/png;base64," + Buffer.from(b).toString("base64"));
  } finally { await p.close(); }
}

/** بيبدّل navigator.vibrate بعدّاد عشان نتأكد من الاهتزاز (أو عدمه) */
export const stubVibrate = (page) => page.evaluateOnNewDocument(() => {
  window.__vibrations = [];
  Object.defineProperty(navigator, "vibrate", { configurable: true, value: (p) => { window.__vibrations.push(p); return true; } });
});

/** وضع الحركة للسويت كله: REDUCED=1 => prefers-reduced-motion: reduce */
export const REDUCED = process.env.REDUCED === "1";
export const applyMotionPref = (page) => page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: REDUCED ? "reduce" : "no-preference" }, { name: "prefers-color-scheme", value: "light" }]);

export class Report {
  constructor() { this.rows = []; }
  check(name, cond, detail = "") {
    this.rows.push({ name, pass: !!cond, detail });
    console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }
  get failed() { return this.rows.filter((r) => !r.pass); }
}
