import path from "node:path";
import { BASE, SHOTS, launch, watchConsole, sleep, clickText, waitText, setLs, adminLogin, lowContrast, auditPage, darkIdentical, REDUCED, applyMotionPref, Report } from "./lib.mjs";

const R = new Report();
const consoleLog = [];
const browser = await launch();
const page = await browser.newPage();
watchConsole(page, consoleLog);
const MODE = REDUCED ? "reduced" : "motion";
await applyMotionPref(page);
// الترانسفورم الحالي لعنصر (identity لو مفيش حركة)
const transformOf = (sel) => page.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return null; const t = getComputedStyle(el).transform; if (t === "none") return { x: 0, y: 0, s: 1 }; const m = new DOMMatrix(t); return { x: Math.round(m.m41), y: Math.round(m.m42), s: +m.m11.toFixed(3) }; }, sel);
const still = (t) => t && t.x === 0 && t.y === 0 && t.s === 1;

// ── داتا ضغط: أسماء وعناوين طويلة وأرقام كبيرة ──
const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
const longName = "عبد الرحمن محمد عبد العزيز السيد الشرقاوي البحيري الكبير";
const longAddr = "شقة 12 الدور السابع عمارة 45 أ شارع الدكتور عبد الحميد بدوي المتفرع من شارع جامعة الدول العربية بجوار صيدلية الشفاء المهندسين الجيزة";
const item = (date, n, name, price, q, addons, note = "") => ({ id: `${date}|${n}`, date, mealId: `m_${n}`, name, price, quantity: q, addons, note });
const bigItems = [
  item(d(1), "koshary", "كشري", 60, 120, [{ id: "ad_salad", name: "سلطة", price: 0 }, { id: "ad_long", name: "صوص طحينة بالليمون والثوم والكمون البلدي الأصلي", price: 25 }], "ملاحظة طويلة جداً: من غير بصل خالص ومن غير شطة والصلصة على جنب لو سمحت وكتر الدقة"),
  item(d(2), "mahshi", "محشي مشكل كرنب وورق عنب وفلفل وكوسة وباذنجان أبيض وأسود", 1250000, 3, [{ id: "ad_rice", name: "أرز زيادة", price: 15 }]),
  item(d(3), "chicken", "فراخ مشوية", 120, 1, []),
];
const sub = bigItems.reduce((s, it) => s + (it.price + it.addons.reduce((a, x) => a + x.price, 0)) * it.quantity, 0);
const orders = [
  { id: "o_big", orderNumber: 1001, status: "new", createdAt: new Date().toISOString(), customer: { name: longName, phone: "01012345678", address: longAddr, notes: "رن الجرس مرتين ومتتصلش قبل الساعة 2 الضهر عشان البيبي نايم" }, items: bigItems, subtotal: sub, deliveryFee: 20, totalPrice: sub + 20 },
  { id: "o_two", orderNumber: 1002, status: "preparing", createdAt: new Date(Date.now() - 3600e3).toISOString(), customer: { name: "سارة", phone: "01255555555", address: "الدقي", notes: "" }, items: [item(d(1), "kofta", "كفتة بالصلصة", 130, 2, [])], subtotal: 260, deliveryFee: 20, totalPrice: 280 },
  { id: "o_three", orderNumber: 1003, status: "cancelled", createdAt: new Date(Date.now() - 7200e3).toISOString(), customer: { name: "منى", phone: "01500000000", address: "مدينة نصر", notes: "" }, items: [item(d(2), "burger", "برجر بيتي", 95, 1, [])], subtotal: 95, deliveryFee: 20, totalPrice: 115 },
];
const addons = [
  { id: "ad_salad", name: "سلطة", price: 0 },
  { id: "ad_long", name: "صوص طحينة بالليمون والثوم والكمون البلدي الأصلي من المطبخ", price: 9999999 },
  { id: "ad_rice", name: "أرز زيادة", price: 15 },
];

await page.setViewport({ width: 1280, height: 800 });
await adminLogin(page);
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("mamafood:db:")) localStorage.removeItem(k); });
await setLs(page, "mamafood:db:orders", orders);
await setLs(page, "mamafood:db:addons", addons);

// ── فحوصات داخل الصفحة ──
const audit = () => auditPage(page);

const WIDTHS = [320, 375, 768, 1024, 1280];
const states = [
  { name: "addons", path: "/admin/addons", ready: "إضافة جديدة", table: true },
  { name: "addons-form", path: "/admin/addons", ready: "إضافة جديدة", open: async () => { await clickText(page, "button", "إضافة جديدة"); await page.waitForSelector("#addon-form"); }, form: true },
  { name: "addons-edit-errors", path: "/admin/addons", ready: "إضافة جديدة", open: async () => {
      await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="تعديل"]')].find((b) => b.offsetParent).click());
      await page.waitForSelector("#addon-form");
      await page.click('#addon-form input[type="checkbox"]');
      await page.click('#addon-form input[autocomplete="off"]', { clickCount: 3 }); await page.keyboard.press("Backspace");
      await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
      await sleep(300);
    }, form: true },
  { name: "addons-delete", path: "/admin/addons", ready: "إضافة جديدة", open: async () => { await page.evaluate(() => [...document.querySelectorAll('button[aria-label^="حذف"]')].filter((b) => b.offsetParent)[1].click()); await page.waitForSelector('[role="dialog"]'); } },
  { name: "orders", path: "/admin/orders", ready: "#1001", table: true, filterBar: true },
  { name: "orders-cancel", path: "/admin/orders", ready: "#1001", open: async () => {
      const sel = await page.evaluateHandle(() => [...document.querySelectorAll("main select:not([aria-label])")].find((s) => s.offsetParent));
      await sel.select("cancelled"); await page.waitForSelector('[role="dialog"]'); } },
  { name: "order-details", path: "/admin/orders/o_big", ready: "العميل" },
  { name: "prep", path: `/admin/orders?tab=prep&day=${d(1)}`, ready: "الإضافات", chips: true },
  { name: "settings", path: "/admin/settings", ready: "حفظ الإعدادات" },
];

for (const w of WIDTHS) {
  await page.setViewport({ width: w, height: 800 });
  for (const s of states) {
    await page.goto(BASE + s.path);
    await waitText(page, s.ready, 8000);
    await sleep(300);
    if (s.open) {
      await s.open();
      // تقليل الحركة: الدايلوج بيظهر في مكانه على طول (من غير scale/slide)
      if (REDUCED) { const t = await transformOf('[role="dialog"]'); R.check(`${w}px ${s.name}: dialog appears without motion`, still(t), JSON.stringify(t)); }
    }
    await sleep(350);
    const a = await audit();
    const tag = `${w}px ${s.name}`;
    R.check(`${tag}: no horizontal scroll`, !a.hscroll, `scrollWidth ${a.scrollWidth} / ${a.vw}`);
    R.check(`${tag}: nothing off-screen / overflowing its card`, !a.offscreen.length && !a.overflowCard.length, [...a.offscreen, ...a.overflowCard].slice(0, 4).join(" | "));
    R.check(`${tag}: tap targets >= 44px`, !a.small.length, a.small.slice(0, 5).join(" | "));
    R.check(`${tag}: no overlapping controls`, !a.overlap.length, a.overlap.slice(0, 3).join(" | "));
    const lc = await lowContrast(page);
    R.check(`${tag}: text contrast >= 3:1`, !lc.length, lc.slice(0, 3).join(" | "));
    R.check(`${tag}: no yellow text on light bg`, !a.yellow.length, a.yellow.slice(0, 3).join(" | "));
    R.check(`${tag}: RTL`, a.dir === "rtl" && a.rtlTable !== false && (s.open || a.rtlHeading !== false), JSON.stringify({ t: a.rtlTable, h: a.rtlHeading }));
    R.check(`${tag}: no customer bottom dock on admin`, !(await page.$("[data-mobile-dock]")));
    if (!REDUCED && (w === 375 || w === 1280)) R.check(`${tag}: identical under prefers-color-scheme: dark`, await darkIdentical(page, { name: `${w}-${s.name}` }));
    if (s.table) R.check(`${tag}: ${w < 768 ? "cards" : "table"}`, w < 768 ? a.cardsVisible && !a.tableVisible : a.tableVisible && !a.cardsVisible);
    if (s.chips && w < 768) R.check(`${tag}: filters = horizontal chip rows`, a.chipRowsScroll.length > 0 && a.chipRowsScroll.every((o) => o === "auto"), a.chipRowsScroll.join());
    if (s.filterBar) {
      const fb = await page.evaluate(() => ({
        selects: [...document.querySelectorAll("main select[aria-label]")].filter((e) => e.offsetParent).length,
        button: [...document.querySelectorAll("main button")].some((b) => b.offsetParent && b.textContent.includes("فلتر")),
        search: !!document.querySelector('main input[type="search"]')?.offsetParent,
      }));
      R.check(`${tag}: filters = ${w < 768 ? "search + فلتر button" : "search + one row of selects"}`, fb.search && (w < 768 ? fb.button && fb.selects === 0 : !fb.button && fb.selects === 6), JSON.stringify(fb));
    }
    if (s.form) {
      const full = a.dialog && a.dialog.w >= a.dialog.vw - 1 && a.dialog.h >= a.dialog.vh - 1;
      R.check(`${tag}: form is ${w < 768 ? "full-screen" : "centered modal"}`, w < 768 ? full : a.dialog && !full, JSON.stringify(a.dialog));
    }
    if (w === 320 || w === 768 || w === 1280) await page.screenshot({ path: path.join(SHOTS, `${MODE}-${w}-${s.name}.png`) });
    // الموبايل: شيت الفلاتر جوه الشاشة، والأزرار 44px+
    if (s.filterBar && w < 768) {
      await clickText(page, "main button", "فلتر");
      await page.waitForSelector('[role="dialog"]');
      await sleep(450);
      const sh = await audit();
      R.check(`${tag} filter sheet: no horizontal scroll, nothing off-screen`, !sh.hscroll && !sh.offscreen.length, [...sh.offscreen].slice(0, 3).join(" | "));
      R.check(`${tag} filter sheet: tap targets >= 44px`, !sh.small.length, sh.small.slice(0, 4).join(" | "));
      R.check(`${tag} filter sheet: apply + clear buttons`, await page.evaluate(() => { const t = [...document.querySelectorAll('[role="dialog"] button')].map((b) => b.textContent.trim()); return t.includes("تطبيق") && t.includes("مسح"); }));
      if (w === 320) await page.screenshot({ path: path.join(SHOTS, `${MODE}-${w}-orders-filter-sheet.png`) });
      await page.keyboard.press("Escape");
      await sleep(300);
    }
  }

  // الدرور (أقل من 1024) أو السايدبار
  await page.goto(BASE + "/admin/settings");
  await waitText(page, "حفظ الإعدادات");
  if (w < 1024) {
    await page.click('button[aria-label="فتح القائمة"]');
    // RTL: الدرور بيدخل من اليمين (x موجب وقت الحركة)، ومع تقليل الحركة مكانه ثابت
    await sleep(40);
    const dt = await transformOf("[data-admin-drawer]");
    R.check(`${w}px drawer: ${REDUCED ? "appears without sliding" : "slides in from the right (RTL)"}`, REDUCED ? still(dt) : dt && dt.x > 0, JSON.stringify(dt));
    await sleep(400);
    const open = await page.evaluate(() => { const n = [...document.querySelectorAll("nav")].find((x) => x.offsetParent && x.getBoundingClientRect().width > 0); return !!n && n.innerText.includes("الطلبات"); });
    const drawerAudit = await audit();
    await page.screenshot({ path: path.join(SHOTS, `${MODE}-${w}-drawer.png`) });
    await page.evaluate(() => [...document.querySelectorAll("nav a")].find((a) => a.offsetParent && a.textContent.includes("الطلبات")).click());
    await waitText(page, "كل الطلبات");
    await sleep(500);
    const closed = await page.evaluate(() => !document.querySelector("[data-admin-drawer]"));
    R.check(`${w}px drawer: opens, navigates, closes`, open && closed && page.url().endsWith("/admin/orders"), page.url());
    R.check(`${w}px drawer: tap targets & no h-scroll`, !drawerAudit.hscroll && !drawerAudit.small.length, drawerAudit.small.join(" | "));
    // Esc يقفل
    await page.click('button[aria-label="فتح القائمة"]'); await sleep(300); await page.keyboard.press("Escape"); await sleep(500);
    R.check(`${w}px drawer: closes with Esc`, await page.evaluate(() => !document.querySelector("[data-admin-drawer]")));
  } else {
    const side = await page.evaluate(() => { const a = document.querySelector("aside"); const r = a.getBoundingClientRect(); return { vis: r.width > 0, right: Math.round(r.right), vw: innerWidth }; });
    R.check(`${w}px sidebar visible on the right (RTL)`, side.vis && side.right === side.vw, JSON.stringify(side));
  }
}

// ── تباين النص في فورمات ومودالات الوجبات والمنيو (375 و 1280) ──
const openFirst = (label) => page.evaluate((label) => [...document.querySelectorAll(`button[aria-label^="${label}"]`)].find((b) => b.offsetParent).click(), label);
const contrastStates = [
  ["meals page", "/admin/meals", "وجبة جديدة", null],
  ["meal form (new)", "/admin/meals", "وجبة جديدة", async () => { await clickText(page, "button", "وجبة جديدة"); await page.waitForSelector("#meal-form"); }],
  ["meal form (edit + errors)", "/admin/meals", "وجبة جديدة", async () => { await openFirst("تعديل"); await page.waitForSelector("#meal-form"); await page.click("#meal-form input", { clickCount: 3 }); await page.keyboard.press("Backspace"); await page.evaluate(() => document.querySelector('button[form="meal-form"]').click()); await sleep(300); }],
  ["meal delete", "/admin/meals", "وجبة جديدة", async () => { await openFirst("حذف"); await page.waitForSelector('[role="dialog"]'); }],
  ["menu page", "/admin/menu", "المنيو الأسبوعي", null],
  ["menu add meal", "/admin/menu", "المنيو الأسبوعي", async () => { await clickText(page, "button", "إضافة وجبة"); await page.waitForSelector('[role="dialog"]'); }],
  ["menu copy day", "/admin/menu", "المنيو الأسبوعي", async () => { await clickText(page, "button", "نسخ يوم ليوم آخر"); await page.waitForSelector('[role="dialog"]'); }],
  ["menu remove meal", "/admin/menu", "المنيو الأسبوعي", async () => { await openFirst("حذف"); await page.waitForSelector('[role="dialog"]'); }],
  ["login", "/admin/login", "تسجيل دخول", null],
];
for (const w of [375, 1280]) {
  await page.setViewport({ width: w, height: 800 });
  for (const [name, p, ready, open] of contrastStates) {
    if (p === "/admin/login") await page.evaluate(() => localStorage.removeItem("mamafood:admin"));
    await page.goto(BASE + p);
    await waitText(page, ready, 8000);
    await sleep(400);
    if (open) await open();
    await sleep(350);
    const lc = await lowContrast(page);
    if (open) R.check(`${w}px ${name}: dialog open`, !!(await page.$('[role="dialog"]')));
    R.check(`${w}px ${name}: text contrast >= 3:1`, !lc.length, lc.slice(0, 3).join(" | "));
    await page.screenshot({ path: path.join(SHOTS, `${MODE}-${w}-${name.replace(/[^a-z]+/g, "-")}.png`) });
    if (p === "/admin/login") await adminLogin(page);
  }
}

// ── الكيبورد على الموبايل: الحقل اللي بيتكتب فيه يفضل باين ──
for (const w of [320, 375]) {
  for (const [label, open, sel] of [
    ["addon price", async () => { await page.goto(BASE + "/admin/addons"); await waitText(page, "إضافة جديدة"); await clickText(page, "button", "إضافة جديدة"); await page.waitForSelector("#addon-form"); }, '#addon-form input[type="number"]'],
    ["settings fee", async () => { await page.goto(BASE + "/admin/settings"); await waitText(page, "حفظ الإعدادات"); }, 'input[type="number"]'],
    ["orders search", async () => { await page.goto(BASE + "/admin/orders"); await waitText(page, "#1001"); }, 'input[type="search"]'],
  ]) {
    await page.setViewport({ width: w, height: 800 });
    await open();
    // الكيبورد بياخد ~ نص الشاشة (interactive-widget=resizes-content)
    await page.setViewport({ width: w, height: 380 });
    await sleep(200);
    await page.focus(sel);
    await sleep(300);
    const vis = await page.evaluate((sel) => {
      const el = document.querySelector(sel); const r = el.getBoundingClientRect();
      const footer = [...document.querySelectorAll('[role="dialog"] footer')].pop();
      const fTop = footer ? footer.getBoundingClientRect().top : innerHeight;
      const header = document.querySelector("header.sticky");
      const hBottom = header && !el.closest('[role="dialog"]') ? header.getBoundingClientRect().bottom : 0;
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), limit: Math.round(Math.min(fTop, innerHeight)), hBottom: Math.round(hBottom), focused: document.activeElement === el };
    }, sel);
    R.check(`${w}px keyboard: ${label} stays visible`, vis.focused && vis.top >= vis.hBottom - 1 && vis.bottom <= vis.limit + 1, JSON.stringify(vis));
  }
}

console.log("\nCONSOLE (errors/warnings):", consoleLog.length ? "\n" + consoleLog.join("\n") : "none");
console.log(`\n${R.rows.length - R.failed.length}/${R.rows.length} passed`);
if (R.failed.length) console.log("\nFAILED:\n" + R.failed.map((f) => `${f.name} — ${f.detail}`).join("\n"));
await browser.close();
process.exit(R.failed.length ? 1 : 0);
