// صفحات الزبون (Phase 3): المقاسات، البوتوم ناف + بار السلة، القبعات، Fly to Cart، الانتقالات، Lottie، الزجاج.
// REDUCED=1 => نفس الفحوصات مع prefers-reduced-motion: reduce + فحوصات "مفيش حركة".
import path from "node:path";
import { BASE, SHOTS, launch, watchConsole, sleep, clickText, waitText, ls, setLs, adminLogin, lowContrast, auditPage, darkIdentical, REDUCED, applyMotionPref, Report } from "./lib.mjs";

const R = new Report();
const consoleLog = [];
const browser = await launch();
const page = await browser.newPage();
watchConsole(page, consoleLog);
await applyMotionPref(page);
const MODE = REDUCED ? "reduced" : "motion";
const WIDTHS = [320, 375, 768, 1024, 1280];
const mobile = (w) => w < 768;

// ── داتا: أول يومين مفتوحين في السلة، ووجبة بصورة "زحمة" عشان نختبر الزجاج و Fly to Cart بالصورة ──
await page.setViewport({ width: 1280, height: 800 });
await page.goto(BASE + "/");
await page.evaluate(() => localStorage.clear());
await page.goto(BASE + "/");
await page.waitForSelector("button[aria-pressed]");
const days = await page.evaluate(async () => {
  const chips = [...document.querySelectorAll("button[aria-pressed]")];
  return chips.map((c) => ({ disabled: c.disabled }));
});
const upcoming = await page.evaluate(() => {
  // نفس منطق menuApi.getUpcoming: النهارده + 7 أيام من بكره
  const pad = (n) => String(n).padStart(2, "0");
  return Array.from({ length: 8 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; });
});
// من غير النهارده: ممكن يتقفل في نص الاختبار (ميعاد القفل في نفس اليوم)
const open = upcoming.filter((_, i) => i > 0 && !days[i].disabled);
const [d1, d2] = open;
const meals = await ls(page, "mamafood:db:meals");
// صورة حقيقية فيها تفاصيل كتير (الباترن) لأول وجبة في كل يوم
await setLs(page, "mamafood:db:meals", meals.map((m) => ({ ...m, image: "/src/assets/pattern.jpg" })));
const cartItem = (date, mealId, name, price, quantity, addons = []) => ({ id: `${date}|${mealId}|${addons.map((a) => a.id).join(",")}|`, date, mealId, name, price, quantity, addons, note: "" });
const seedCart = (items, dates = [d1, d2]) => setLs(page, "mamafood:cart", { state: { selectedDates: dates, items, customer: { name: "", phone: "", address: "", notes: "" } }, version: 0 });
const fullCart = [cartItem(d1, "m_x", "كشري", 60, 2, [{ id: "ad_salad", name: "سلطة", price: 0 }]), cartItem(d2, "m_y", "محشي مشكل", 110, 1)];

const dockInfo = () => page.evaluate(() => {
  const dock = document.querySelector("[data-mobile-dock]");
  if (!dock) return { exists: false };
  const cs = getComputedStyle(dock);
  const panel = dock.firstElementChild;
  const nav = dock.querySelector("nav");
  const bar = panel?.querySelector(":scope > div:not(nav)");
  const r = (el) => el && el.getBoundingClientRect();
  const t = panel && getComputedStyle(panel).transform;
  return {
    exists: true, shown: cs.display !== "none" && !dock.dataset.hidden,
    display: cs.display, hidden: dock.dataset.hidden === "true", transform: t,
    navTop: r(nav)?.top, barBottom: r(bar)?.bottom, barExists: !!bar,
    dockTop: r(panel)?.top, vh: innerHeight,
    badge: dock.querySelector("[data-cart-target] .bg-brand-yellow")?.textContent || "",
  };
});

// المحتوى مش مستخبي ورا الدوك/الكبسولة: آخر سطر في الفوتر فوقهم لما نسكرل لآخر الصفحة
const contentClear = () => page.evaluate(async () => {
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  await new Promise((r) => setTimeout(r, 250));
  const last = [...document.querySelectorAll("footer p")].pop().getBoundingClientRect();
  const blockers = [document.querySelector("[data-mobile-dock] > div"), document.querySelector("[data-floating-cart]")]
    .filter((el) => el && el.getBoundingClientRect().height > 0 && getComputedStyle(el.closest("[data-mobile-dock]") || el).display !== "none");
  const top = Math.min(innerHeight, ...blockers.map((b) => b.getBoundingClientRect().top));
  window.scrollTo({ top: 0, behavior: "instant" });
  return { lastBottom: Math.round(last.bottom), blockTop: Math.round(top), ok: last.bottom <= top + 1 };
});

// ── القبعات: مش فوق أي كلام أو زرار في الهيرو، وبتتحرك (أو ثابتة مع تقليل الحركة) ──
const hatsCheck = () => page.evaluate(async () => {
  const hero = document.querySelector("[data-hero-hats]").parentElement;
  const content = [...hero.querySelectorAll("img, h1, p, a, button")];
  const hats = [...document.querySelectorAll("[data-hero-hats] svg")].filter((h) => h.getBoundingClientRect().width > 0);
  const overlaps = [];
  const transforms = [];
  for (let k = 0; k < 4; k++) {
    for (const h of hats) {
      const a = h.getBoundingClientRect();
      for (const c of content) {
        const b = c.getBoundingClientRect();
        if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps.push(`${c.tagName} ${c.textContent.trim().slice(0, 15)}`);
      }
    }
    transforms.push(hats.map((h) => getComputedStyle(h).transform).join("|"));
    await new Promise((r) => setTimeout(r, 450));
  }
  const decorative = hats.every((h) => h.closest("[aria-hidden='true']") && getComputedStyle(h).pointerEvents === "none");
  return { count: hats.length, overlaps: [...new Set(overlaps)], moving: new Set(transforms).size > 1, decorative };
});

// تباين أسوأ حالة للزجاج: الكلام/الأيقونات فوق نفس اللون الشفاف بس على خلفية بيضا أو سودا تحتها
const glassCheck = () => page.evaluate(() => {
  const rgba = (s) => { const v = (s.match(/[\d.]+/g) || []).map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; };
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const out = [];
  for (const glass of document.querySelectorAll(".glass-cream")) {
    if (!glass.getBoundingClientRect().height) continue;
    const bg = rgba(getComputedStyle(glass).backgroundColor);
    for (const under of [[255, 255, 255], [0, 0, 0]]) {
      const eff = [0, 1, 2].map((i) => bg[i] * bg[3] + under[i] * (1 - bg[3]));
      for (const el of glass.querySelectorAll("span, svg, a, button")) {
        if (!el.getBoundingClientRect().width) continue;
        // اللي ليه خلفية صلبة جوه الزجاج (زي زرار كمّل الطلب الأحمر) مش محتاج الحساب ده
        let solid = false;
        for (let p = el; p && p !== glass; p = p.parentElement) if (rgba(getComputedStyle(p).backgroundColor)[3] >= 0.9) solid = true;
        if (solid) continue;
        const fg = rgba(getComputedStyle(el).color);
        const cr = ratio(fg, eff);
        out.push({ cls: "cream", cr: +cr.toFixed(2), text: (el.textContent || el.tagName).trim().slice(0, 15) });
      }
    }
  }
  const worst = out.sort((a, b) => a.cr - b.cr)[0];
  return { worst, supports: CSS.supports("backdrop-filter", "blur(1px)") || CSS.supports("-webkit-backdrop-filter", "blur(1px)") };
});

const runAudit = async (tag) => {
  const a = await auditPage(page);
  R.check(`${tag}: no horizontal scroll`, !a.hscroll, `scrollWidth ${a.scrollWidth} / ${a.vw}`);
  R.check(`${tag}: nothing off-screen / overflowing its card`, !a.offscreen.length && !a.overflowCard.length, [...a.offscreen, ...a.overflowCard].slice(0, 4).join(" | "));
  R.check(`${tag}: tap targets >= 44px`, !a.small.length, a.small.slice(0, 5).join(" | "));
  R.check(`${tag}: no overlapping controls`, !a.overlap.length, a.overlap.slice(0, 3).join(" | "));
  R.check(`${tag}: no yellow text on light bg`, !a.yellow.length, a.yellow.slice(0, 3).join(" | "));
  const lc = await lowContrast(page);
  R.check(`${tag}: text contrast >= 3:1`, !lc.length, lc.slice(0, 3).join(" | "));
  R.check(`${tag}: RTL`, a.dir === "rtl");
  return a;
};

const states = [
  { name: "home", path: "/", ready: "اختار أيامك", cart: [] },
  { name: "home-with-cart", path: "/", ready: "وجبات الأيام المختارة", cart: fullCart, bar: true },
  { name: "cart-drawer", path: "/", ready: "وجبات الأيام المختارة", cart: fullCart, open: async () => { await page.evaluate(() => document.querySelector('[data-cart-target="desktop"]').click()); await page.waitForSelector('[role="dialog"]'); }, dialog: true },
  { name: "cart-empty", path: "/", ready: "اختار أيامك", cart: [], open: async () => { await page.evaluate(() => document.querySelector('[data-cart-target="desktop"]').click()); await page.waitForSelector('[data-lottie="emptyCart"] svg'); }, dialog: true },
  { name: "addons-sheet", path: "/", ready: "وجبات الأيام المختارة", cart: fullCart, open: async () => {
      await page.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "إضافات" && b.offsetParent).click());
      await page.waitForSelector('[role="dialog"] fieldset'); }, dialog: true },
  { name: "checkout", path: "/checkout", ready: "إتمام الطلب", cart: fullCart },
  { name: "not-found", path: "/no-such-page", ready: "الصفحة دي مش موجودة", cart: [] },
];

for (const w of WIDTHS) {
  await page.setViewport({ width: w, height: 800 });
  for (const s of states) {
    await seedCart(s.cart, s.cart.length ? [d1, d2] : []);
    await page.goto(BASE + s.path);
    await waitText(page, s.ready, 8000);
    await sleep(500);
    if (s.open) { await s.open(); await sleep(450); }
    const tag = `${w}px ${s.name}`;
    await runAudit(tag, s);

    // البوتوم ناف: موبايل بس، وبار السلة فوقه على طول من غير تداخل
    const dock = await dockInfo();
    R.check(`${tag}: bottom nav ${mobile(w) ? "visible" : "hidden"}`, dock.exists && (mobile(w) ? dock.display !== "none" : dock.display === "none"), JSON.stringify({ display: dock.display }));
    if (mobile(w) && !s.dialog) {
      if (s.bar) R.check(`${tag}: sticky bar sits right above bottom nav`, dock.barExists && dock.barBottom <= dock.navTop + 1, JSON.stringify({ bar: dock.barBottom, nav: dock.navTop }));
      const cnt = s.cart.reduce((n, it) => n + it.quantity, 0);
      R.check(`${tag}: bottom nav cart badge = ${cnt}`, (dock.badge || "0") === String(cnt) || (!cnt && !dock.badge), dock.badge);
    }
    if (!s.dialog) {
      const cc = await contentClear();
      R.check(`${tag}: content never hidden behind bottom bars`, cc.ok, JSON.stringify(cc));
    }
    if (!mobile(w) && s.bar) R.check(`${tag}: floating cart pill (desktop) visible`, await page.evaluate(() => !!document.querySelector("[data-floating-cart]")?.getBoundingClientRect().height));

    if (s.name === "home") {
      const h = await hatsCheck();
      R.check(`${tag}: hats ${mobile(w) ? "2 small" : "5"} and decorative`, h.count === (mobile(w) ? 2 : 5) && h.decorative, JSON.stringify({ n: h.count, d: h.decorative }));
      R.check(`${tag}: hats never cover hero text/buttons`, !h.overlaps.length, h.overlaps.join(" | "));
      R.check(`${tag}: hats ${REDUCED ? "static" : "floating"}`, REDUCED ? !h.moving : h.moving);
    }
    if (!REDUCED && (w === 375 || w === 1280)) R.check(`${tag}: identical under prefers-color-scheme: dark`, await darkIdentical(page, { name: `cust-${w}-${s.name}` }));
    if ([320, 768, 1280].includes(w)) await page.screenshot({ path: path.join(SHOTS, `${MODE}-cust-${w}-${s.name}.png`) });
  }

  // الزجاج: الكلام مقروء حتى فوق صورة "زحمة" (سكرول لحد ما صور الوجبات تبقى تحت الناف بار)
  await seedCart(fullCart);
  await page.goto(BASE + "/");
  await waitText(page, "وجبات الأيام المختارة");
  await page.evaluate(() => document.querySelector("article img")?.scrollIntoView({ block: "start", behavior: "instant" }));
  await sleep(400);
  const g = await glassCheck();
  // الناف بار والكبسولة بقوا أحمر صلب (مش زجاج) => الزجاج الوحيد الباقي هو الدوك الكريمي على الموبايل
  R.check(`${w}px glass bars readable (worst case >= 3:1)`, mobile(w) ? g.worst && g.worst.cr >= 3 : !g.worst, JSON.stringify(g));
  await page.screenshot({ path: path.join(SHOTS, `${MODE}-cust-${w}-glass-over-photo.png`) });

  // الكيبورد: الدوك بيستخبى وقت الكتابة في Checkout ويرجع بعدها
  if (mobile(w)) {
    await page.goto(BASE + "/checkout");
    await waitText(page, "إتمام الطلب");
    await page.focus('input[placeholder="اسمك الكامل"]');
    await sleep(450);
    const k = await dockInfo();
    const inputBottom = await page.$eval('input[placeholder="اسمك الكامل"]', (i) => i.getBoundingClientRect().bottom);
    R.check(`${w}px checkout: bottom nav hides while typing`, k.hidden && (k.dockTop >= k.vh - 1 || REDUCED), JSON.stringify(k));
    R.check(`${w}px checkout: focused input not covered`, inputBottom <= (k.hidden ? k.vh : k.dockTop));
    await page.evaluate(() => document.activeElement.blur());
    await sleep(450);
    const k2 = await dockInfo();
    R.check(`${w}px checkout: bottom nav returns after typing`, !k2.hidden && k2.dockTop < k2.vh, JSON.stringify(k2));
  }
}

// ── Fly to Cart (375 و 1280) وهي متسكرلة، و 10 ضغطات سريعة ──
const watchFlyLayer = () => page.evaluate(() => {
  window.__fly = { max: 0, sw: [] };
  const tick = () => {
    const n = document.getElementById("fly-layer")?.childElementCount || 0;
    window.__fly.max = Math.max(window.__fly.max, n);
    window.__fly.sw.push(document.documentElement.scrollWidth - innerWidth);
    window.__flyRaf = requestAnimationFrame(tick);
  };
  tick();
});
const flyResult = () => page.evaluate(() => { cancelAnimationFrame(window.__flyRaf); return { max: window.__fly.max, maxOverflow: Math.max(...window.__fly.sw), left: document.getElementById("fly-layer")?.childElementCount || 0 }; });
const badgeCount = (w) => page.evaluate((sel) => document.querySelector(`${sel} .bg-brand-yellow`)?.textContent || "0", mobile(w) ? '[data-cart-target="mobile"]' : '[data-cart-target="desktop"]');

for (const w of [375, 1280]) {
  await page.setViewport({ width: w, height: 800 });
  await seedCart([], [d1]);
  await page.goto(BASE + "/");
  await waitText(page, "وجبات الأيام المختارة");
  await sleep(600);
  // نسكرل لحد زرار "+" بتاع آخر وجبة (الصفحة متسكرلة)
  const plusSel = `#day-panel-${d1} button[aria-label^="أضف"]`;
  await page.$$eval(plusSel, (bs) => bs[bs.length - 1].scrollIntoView({ block: "center", behavior: "instant" }));
  await sleep(300);
  const scrolled = await page.evaluate(() => scrollY);
  const target = await page.evaluate((sel) => { const t = document.querySelector(sel); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, mobile(w) ? '[data-cart-target="mobile"] [data-cart-bump]' : '[data-cart-target="desktop"] [data-cart-bump]');
  await watchFlyLayer();
  const plus = (await page.$$(plusSel)).pop();
  await plus.click();
  // نص الطريق تقريباً: الدايرة طايرة
  await sleep(120);
  const mid = await page.evaluate(() => { const d = document.getElementById("fly-layer")?.firstElementChild; if (!d) return null; const r = d.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await sleep(430);
  const near = await page.evaluate(() => { const d = document.getElementById("fly-layer")?.firstElementChild; if (!d) return null; const r = d.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await sleep(700);
  let fr = await flyResult();
  if (REDUCED) {
    R.check(`${w}px fly to cart: no flight under reduced motion`, fr.max === 0, JSON.stringify(fr));
  } else {
    R.check(`${w}px fly to cart: flies while page scrolled (scrollY ${Math.round(scrolled)})`, fr.max === 1 && !!mid, JSON.stringify({ fr, mid }));
    const dist = near ? Math.hypot(near.x - target.x, near.y - target.y) : 999;
    R.check(`${w}px fly to cart: lands on the ${mobile(w) ? "bottom nav" : "navbar"} cart icon`, dist < 60, `distance ${Math.round(dist)}px`);
    R.check(`${w}px fly to cart: no horizontal scroll during flight`, fr.maxOverflow <= 0, String(fr.maxOverflow));
  }
  R.check(`${w}px fly to cart: element cleaned up`, fr.left === 0);
  R.check(`${w}px fly to cart: count = 1`, (await badgeCount(w)) === "1", await badgeCount(w));

  // 10 ضغطات سريعة على "+" بتاع نفس الوجبة (بقى ستيبر)
  await watchFlyLayer();
  const more = (await page.$$(`#day-panel-${d1} button[aria-label="أكتر"]`)).pop();
  for (let i = 0; i < 10; i++) await more.click({ delay: 0 });
  await sleep(1500);
  fr = await flyResult();
  const qty = (await ls(page, "mamafood:cart")).state.items.reduce((n, it) => n + it.quantity, 0);
  R.check(`${w}px rapid 10 taps: count correct (11)`, qty === 11 && (await badgeCount(w)) === "11", `store ${qty}, badge ${await badgeCount(w)}`);
  R.check(`${w}px rapid 10 taps: ${REDUCED ? "no flights" : "at most 3 flying at once"}`, REDUCED ? fr.max === 0 : fr.max <= 3 && fr.max >= 1, JSON.stringify(fr));
  R.check(`${w}px rapid 10 taps: nothing stuck, no horizontal scroll`, fr.left === 0 && fr.maxOverflow <= 0, JSON.stringify(fr));

  // انتقال الصفحات: مفيش سكرول أفقي وقت الأنيميشن
  await watchFlyLayer();
  await page.evaluate(() => document.querySelector('header a[href="/"]').click());
  await page.goto(BASE + "/checkout"); // تحميل كامل
  await waitText(page, "إتمام الطلب");
  await watchFlyLayer();
  await page.evaluate(() => document.querySelector('header a[href="/"]').click());
  await sleep(400);
  fr = await flyResult();
  R.check(`${w}px page transition: no horizontal scroll while animating`, fr.maxOverflow <= 0, String(fr.maxOverflow));
}

// ── البوتوم ناف: الروابط شغالة (375) ──
await page.setViewport({ width: 375, height: 800 });
await seedCart(fullCart);
await page.goto(BASE + "/");
await waitText(page, "وجبات الأيام المختارة");
await page.evaluate(() => [...document.querySelectorAll("[data-mobile-dock] nav a")].find((a) => a.textContent.includes("إتمام الطلب")).click());
await page.waitForFunction(() => location.pathname === "/checkout");
await page.evaluate(() => [...document.querySelectorAll("[data-mobile-dock] nav a")].find((a) => a.textContent.includes("الرئيسية")).click());
await page.waitForFunction(() => location.pathname === "/");
await page.evaluate(() => document.querySelector('[data-mobile-dock] [data-cart-target="mobile"]').click());
await page.waitForSelector('[role="dialog"]');
R.check("375px bottom nav: Home / Checkout links and Cart button work", true);
await page.keyboard.press("Escape");
await sleep(400);

// ── BottomSheet: السحب لتحت من العنوان بيقفله (موبايل) ──
await page.evaluate(() => document.querySelector('[data-mobile-dock] [data-cart-target="mobile"]').click());
await page.waitForSelector('[role="dialog"] header');
await sleep(500);
const hb = await page.$eval('[role="dialog"] header h2', (h) => { const r = h.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await page.mouse.move(hb.x, hb.y);
await page.mouse.down();
for (let i = 1; i <= 12; i++) { await page.mouse.move(hb.x, hb.y + i * 22); await sleep(16); }
await page.mouse.up();
await sleep(700);
R.check("375px bottom sheet: drag down to close", !(await page.$('[role="dialog"]')));
await seedCart([]);
await page.goto(BASE + "/");
await page.evaluate(() => [...document.querySelectorAll("[data-mobile-dock] nav button")].find((a) => a.textContent.includes("إتمام الطلب")).click());
await waitText(page, "السلة فاضية");
R.check("375px bottom nav: Checkout with empty cart explains instead of redirecting", page.url() === BASE + "/");

// ── Lottie في كل الـ empty states (+ ثابت مع تقليل الحركة، ومن غير layout shift) ──
const lottieState = async (sel) => {
  await page.waitForSelector(`${sel} svg`, { timeout: 8000 });
  const a = await page.$eval(sel, (el) => el.innerHTML);
  await sleep(700);
  const b = await page.$eval(sel, (el) => el.innerHTML);
  const box = await page.$eval(sel, (el) => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height, style: el.style.width }; });
  return { animating: a !== b, box };
};
const checkLottie = async (label, sel) => {
  try {
    const s = await lottieState(sel);
    R.check(`lottie ${label}: shows ${REDUCED ? "static frame" : "animation"}`, REDUCED ? !s.animating : s.animating, JSON.stringify(s.box));
    R.check(`lottie ${label}: space reserved`, s.box.w > 0 && `${s.box.w}px` === s.box.style);
  } catch (e) { R.check(`lottie ${label}: shows`, false, e.message); }
};
await page.setViewport({ width: 1280, height: 800 });
// CLS في صفحة 404 (الـ Lottie بيتحمّل lazy)
await page.evaluateOnNewDocument(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
await page.goto(BASE + "/no-such-page");
await checkLottie("404", '[data-lottie="notFound"]');
R.check("404: no layout shift from lazy Lottie (CLS < 0.01)", (await page.evaluate(() => window.__cls)) < 0.01, String(await page.evaluate(() => window.__cls)));
await seedCart([]);
await page.goto(BASE + "/");
await page.waitForSelector('[data-cart-target="desktop"]');
await page.evaluate(() => document.querySelector('[data-cart-target="desktop"]').click());
await checkLottie("empty cart", '[data-lottie="emptyCart"]');
// يوم مختار وبعدين الأدمن شال وجباته => "مفيش وجبات في اليوم ده"
const weekly = await ls(page, "mamafood:db:weeklyMenu");
const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][new Date(d1 + "T00:00").getDay()];
await setLs(page, "mamafood:db:weeklyMenu", { ...weekly, [dayKey]: [] });
await seedCart([], [d1]);
await page.goto(BASE + "/");
await waitText(page, "مفيش وجبات في اليوم ده", 8000).catch(() => {});
await checkLottie("no meals for a day (customer)", '[data-lottie="noMeals"]');
// الأدمن
await adminLogin(page);
await page.evaluate(() => { localStorage.setItem("mamafood:db:orders", "[]"); });
await page.goto(BASE + "/admin/orders");
await checkLottie("no orders (admin)", '[data-lottie="noOrders"]');
await page.goto(BASE + "/admin/orders?tab=prep");
await checkLottie("no orders for prep day (admin)", '[data-lottie="noOrders"]');
await setLs(page, "mamafood:db:orders", [{ id: "o1", orderNumber: 1001, status: "new", createdAt: new Date().toISOString(), customer: { name: "سارة", phone: "01255555555", address: "x", notes: "" }, items: fullCart, subtotal: 230, deliveryFee: 20, totalPrice: 250 }]);
await page.goto(BASE + "/admin/orders?q=zzzz");
await checkLottie("no search results (admin orders)", '[data-lottie="noResults"]');
await page.goto(BASE + "/admin/meals");
await waitText(page, "وجبة جديدة");
await page.waitForSelector('main input[type="search"]');
await page.type('main input[type="search"]', "zzzz");
await checkLottie("no search results (admin meals)", '[data-lottie="noResults"]');
await page.goto(BASE + "/admin/menu");
await waitText(page, "المنيو الأسبوعي");
await checkLottie("no meals for a day (admin menu)", '[data-lottie="noMeals"]');
await clickText(page, "button", "إضافة وجبة");
await page.waitForSelector('[role="dialog"] input');
await page.type('[role="dialog"] input', "zzzz");
await checkLottie("no search results (add meal)", '[role="dialog"] [data-lottie="noResults"]');
await page.keyboard.press("Escape");
await setLs(page, "mamafood:db:addons", []);
await page.goto(BASE + "/admin/addons");
await checkLottie("no addons (admin)", '[data-lottie="noOrders"]');

console.log("\nCONSOLE (errors/warnings):", consoleLog.length ? "\n" + consoleLog.join("\n") : "none");
console.log(`\n${R.rows.length - R.failed.length}/${R.rows.length} passed`);
if (R.failed.length) console.log("\nFAILED:\n" + R.failed.map((f) => `${f.name} — ${f.detail}`).join("\n"));
await browser.close();
process.exit(R.failed.length ? 1 : 0);
