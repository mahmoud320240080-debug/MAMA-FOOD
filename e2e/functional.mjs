import path from "node:path";
import { fileURLToPath } from "node:url";
import { stubVibrate, applyMotionPref, REDUCED } from "./lib.mjs";
import { BASE, SHOTS, launch, watchConsole, sleep, clickText, waitText, ls, setLs, adminLogin, dayLabel, price, Report } from "./lib.mjs";

const R = new Report();
const consoleLog = [];
const browser = await launch();
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
watchConsole(page, consoleLog);
await stubVibrate(page);
await applyMotionPref(page);

const lineTotal = (it) => (it.price + it.addons.reduce((s, a) => s + a.price, 0)) * it.quantity;
const rowTexts = (page) => page.evaluate(() =>
  [...document.querySelectorAll("table tbody tr")].filter((r) => r.offsetParent).map((r) => r.innerText));

// ───────────── 1) طلب من الزبون على يومين بإضافات مختلفة ─────────────
await page.goto(BASE + "/");
await page.evaluate(() => localStorage.clear());
await page.goto(BASE + "/");
await page.waitForSelector("button[aria-pressed]");
const chips = await page.$$eval("button[aria-pressed]", (bs) => bs.map((b, i) => ({ i, disabled: b.disabled })));
// أول يومين مفتوحين من غير النهارده (النهارده ممكن يتقفل في نص الاختبار)
const enabled = chips.filter((c) => c.i > 0 && !c.disabled).slice(0, 2);
for (const c of enabled) await page.evaluate((i) => document.querySelectorAll("button[aria-pressed]")[i].click(), c.i);
await sleep(300);
const dates = await page.$$eval('button[aria-controls^="day-panel-"]', (bs) => bs.map((b) => b.getAttribute("aria-controls").replace("day-panel-", "")));
R.check("customer: picked 2 open days", dates.length === 2, dates.join(", "));

async function addViaSheet(date, mealIdx, addonIdxs, note) {
  const expanded = await page.$eval(`button[aria-controls="day-panel-${date}"]`, (b) => b.getAttribute("aria-expanded"));
  if (expanded !== "true") await page.$eval(`button[aria-controls="day-panel-${date}"]`, (b) => b.click());
  await sleep(300);
  await page.evaluate((date, mealIdx) => {
    const btns = [...document.querySelectorAll(`#day-panel-${date} button`)].filter((b) => b.textContent.trim() === "إضافات");
    btns[mealIdx].scrollIntoView({ block: "center" });
    btns[mealIdx].click();
  }, date, mealIdx);
  await page.waitForSelector('[role="dialog"] fieldset label');
  const sub = await page.$eval('[role="dialog"]', (d) => d.innerText);
  const expSub = "ل" + dayLabel(date).slice(1);
  R.check(`addons sheet subtitle "${expSub}"`, sub.includes(expSub) && !sub.includes("لال"), expSub);
  await page.evaluate((addonIdxs) => {
    const labels = [...document.querySelectorAll('[role="dialog"] fieldset label')];
    const idxs = addonIdxs.map((i) => (i < 0 ? labels.length + i : i));
    idxs.forEach((i) => labels[i].click());
  }, addonIdxs);
  if (note) await page.type('[role="dialog"] textarea', note);
  await clickText(page, "button", "أضف للسلة", { root: "dialog" });
  await page.waitForFunction(() => ![...document.querySelectorAll('[role="dialog"]')].some((d) => d.innerText.includes('أضف للسلة')), { timeout: 5000 }).catch(async (e) => { console.log(await page.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].map((d) => d.innerText))); await page.screenshot({ path: path.join(SHOTS, "fail.png") }); throw e; });
}
await addViaSheet(dates[0], 0, [0, 1], "من غير بصل");
await addViaSheet(dates[1], 1, [1]);
// اقفل درج السلة لو اتفتح
if (await page.$('[role="dialog"]')) { await page.keyboard.press("Escape"); await sleep(300); }
// زوّد كمية سطر اليوم التاني لـ 2 من الـ stepper
await page.evaluate((date) => {
  const plus = document.querySelector(`#day-panel-${date} button[aria-label="أكتر"]`);
  plus.click();
}, dates[1]);
await sleep(200);
const cart = (await ls(page, "mamafood:cart")).state;
R.check("customer: cart has 2 lines on 2 days with addons", cart.items.length === 2 && new Set(cart.items.map((i) => i.date)).size === 2 && cart.items.every((i) => i.addons.length > 0),
  cart.items.map((i) => `${i.date} ${i.name}×${i.quantity} [${i.addons.map((a) => a.name + ":" + a.price).join(",")}]`).join(" | "));
const addonSets = cart.items.map((i) => i.addons.map((a) => a.id).sort().join(","));
R.check("customer: different addons per day", addonSets[0] !== addonSets[1]);

await clickText(page, "button", "كمّل الطلب");
await page.waitForSelector('[role="dialog"]');
await clickText(page, "button", "كمّل الطلب", { root: "dialog" });
await sleep(400);
if (await page.evaluate(() => document.body.innerText.includes("كمّل بدونه"))) await clickText(page, "button", "كمّل بدونه");
await page.waitForFunction(() => location.pathname === "/checkout");
const settings0 = await ls(page, "mamafood:db:settings");
await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
await page.type('input[placeholder="اسمك الكامل"]', "أم محمد عبد الرحمن");
await page.type('input[placeholder="01012345678"]', "01012345678");
await page.type('input[placeholder="الشارع، رقم العمارة، الدور، أقرب علامة مميزة"]', "15 شارع التحرير، الدقي، الجيزة");
await clickText(page, "button", "أكّد الطلب");
await page.waitForFunction(() => location.pathname.startsWith("/order-success/"), { timeout: 8000 }).catch(async (e) => { console.log(await page.evaluate(() => document.body.innerText.slice(0, 1500))); await page.screenshot({ path: path.join(SHOTS, "fail.png"), fullPage: true }); throw e; });
// اهتزاز: اختيار يومين + إضافتين من الشيت + "+" من الستيبر + تأكيد الطلب (ومع تقليل الحركة: ولا مرة)
const vib = await page.evaluate(() => window.__vibrations.length);
R.check(`haptics: ${REDUCED ? "none under reduced motion" : "vibrate on day select, add to cart, place order"}`, REDUCED ? vib === 0 : vib >= 6, String(vib));
const orders1 = await ls(page, "mamafood:db:orders");
const order = orders1[0];
const expSub = cart.items.reduce((s, it) => s + lineTotal(it), 0);
R.check("checkout: order saved with cart items", JSON.stringify(order.items) === JSON.stringify(cart.items));
const area0 = settings0.deliveryAreas.find((a) => a.enabled);
R.check("checkout: totals = subtotal + the area's delivery fee", order.subtotal === expSub && order.deliveryFee === area0.price && order.totalPrice === expSub + area0.price,
  `sub ${order.subtotal} fee ${order.deliveryFee} total ${order.totalPrice}`);
R.check("checkout: the only area is picked automatically and stored on the order", order.deliveryArea?.id === area0.id && order.deliveryArea?.name === area0.name, JSON.stringify(order.deliveryArea));
R.check("cash order unchanged: paymentMethod cash, payment not_required, success page", order.paymentMethod === "cash" && order.payment?.status === "not_required" && page.url().includes("/order-success/"), JSON.stringify({ m: order.paymentMethod, s: order.payment?.status }));

// ───────────── الأدمن: الطلب ظاهر ─────────────
await adminLogin(page);
await page.goto(BASE + "/admin/orders");
await waitText(page, `#${order.orderNumber}`);
let rows = await rowTexts(page);
const row = rows.find((r) => r.includes(`#${order.orderNumber}`)) || "";
R.check("admin list: order appears", !!row);
R.check("admin list: name, phone, both days, total", row.includes("أم محمد عبد الرحمن") && row.includes("01012345678") && dates.every((d) => row.includes(dayLabel(d))) && row.includes(price(order.totalPrice)), row.replace(/\n/g, " / "));

// ───────────── 2) تغيير الحالة + ريفريش ─────────────
const selSel = "table tbody tr select";
await page.select(selSel, "preparing");
await waitText(page, `طلب #${order.orderNumber}: بيتحضر`);
await page.reload();
await page.waitForSelector(selSel);
const selVal = await page.$eval(selSel, (s) => s.value);
R.check("status change persisted after refresh", selVal === "preparing" && (await ls(page, "mamafood:db:orders"))[0].status === "preparing", selVal);
const opts = await page.$eval(selSel, (s) => [...s.options].map((o) => o.value).join(","));
R.check("status options = current + next + cancel", opts === "preparing,delivering,cancelled", opts);

// ───────────── 3) البحث والفلاتر (بطلبات زيادة) ─────────────
const mk = (n, name, phone, status, items, mins) => ({
  id: `o_test${n}`, orderNumber: 1000 + n, status, createdAt: new Date(Date.now() - mins * 60000).toISOString(),
  customer: { name, phone, address: "عنوان", notes: "" }, items,
  subtotal: items.reduce((s, it) => s + lineTotal(it), 0), deliveryFee: 20,
  totalPrice: items.reduce((s, it) => s + lineTotal(it), 0) + 20,
});
const it = (date, mealId, name, p, q, addons) => ({ id: `${date}|${mealId}|${addons.map((a) => a.id).join(",")}|`, date, mealId, name, price: p, quantity: q, addons, note: "" });
const salad = { id: "ad_salad", name: "سلطة", price: 0 }, ketchup = { id: "ad_ketchup", name: "كاتشب", price: 0 }, rice = { id: "ad_rice", name: "أرز زيادة", price: 15 };
const extra = [
  mk(10, "كريم سامي", "01198765432", "new", [it(dates[0], "m_koshary", "كشري", 60, 3, [salad]), it(dates[0], "m_burger", "برجر بيتي", 95, 1, [ketchup])], 60),
  mk(11, "سارة حسن", "01255555555", "delivering", [it(dates[1], "m_koshary", "كشري", 60, 2, [salad, rice])], 120),
  mk(12, "منى علي (ملغي)", "01500000000", "cancelled", [it(dates[0], "m_koshary", "كشري", 60, 5, [salad])], 30),
];
await setLs(page, "mamafood:db:orders", [...(await ls(page, "mamafood:db:orders")), ...extra]);
await page.reload();
await waitText(page, "#1012");
rows = await rowTexts(page);
const nums = (rs) => rs.map((r) => (r.match(/#(\d+)/) || [])[1]);
R.check("list sorted newest first", nums(rows).join(",") === [order.orderNumber, 1012, 1010, 1011].join(","), nums(rows).join(","));

const typeSearch = async (q) => {
  await page.click('input[type="search"]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  if (q) await page.type('input[type="search"]', q);
  await sleep(500); // البحث بيتبعت بعد ما الكتابة تهدى

  return nums(await rowTexts(page));
};
let r1 = await typeSearch("1010");
R.check("search by order number", r1.join() === "1010", r1.join());
r1 = await typeSearch("سارة");
R.check("search by customer name", r1.join() === "1011", r1.join());
r1 = await typeSearch("0150");
R.check("search by phone", r1.join() === "1012", r1.join());
await typeSearch("");
await page.select('main select[aria-label="الحالة"]', "cancelled");
await sleep(150);
r1 = nums(await rowTexts(page));
R.check("filter by status (ملغي)", r1.join() === "1012", r1.join());
await page.select('main select[aria-label="الحالة"]', "");
await page.select('main select[aria-label="اليوم المطلوب"]', dates[1]);
await sleep(150);
r1 = nums(await rowTexts(page));
R.check("filter by requested day (item date, not createdAt)", r1.sort().join() === [order.orderNumber, 1011].sort().join(), `${dayLabel(dates[1])}: ${r1.join()}`);
await page.select('main select[aria-label="الحالة"]', "delivering");
await sleep(150);
r1 = nums(await rowTexts(page));
R.check("status + day filters combine", r1.join() === "1011", r1.join());
await page.reload();
// نستنى الصفوف نفسها بدل وقت ثابت (وقت التحميل بعد الريفريش بيختلف)
await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length > 0, { timeout: 8000 }).catch(() => {});
r1 = nums(await rowTexts(page));
R.check("filters survive refresh (URL params)", r1.join() === "1011" && page.url().includes("status=delivering"), page.url());
await clickText(page, "button", "مسح الفلاتر");
await sleep(150);
R.check("clear filters", (await rowTexts(page)).length === 4);

// المنطقة: بحث باسمها، وفلتر "من غير منطقة" للطلبات القديمة، والترتيب بالأعلى قيمة
r1 = await typeSearch("كل المناطق");
R.check("search by delivery area name", r1.join() === String(order.orderNumber), r1.join());
await typeSearch("");
await page.select('main select[aria-label="المنطقة"]', "none");
await sleep(150);
r1 = nums(await rowTexts(page));
R.check("filter by area: old orders without an area", r1.slice().sort().join() === "1010,1011,1012", r1.join());
await page.select('main select[aria-label="المنطقة"]', "");
await page.select('main select[aria-label="الترتيب"]', "highest");
await sleep(150);
r1 = nums(await rowTexts(page));
const totalOf = Object.fromEntries((await ls(page, "mamafood:db:orders")).map((o) => [String(o.orderNumber), o.totalPrice]));
R.check("sort by highest total", r1.length === 4 && r1.every((n, k) => k === 0 || totalOf[r1[k - 1]] >= totalOf[n]), r1.map((n) => `${n}:${totalOf[n]}`).join(" "));
R.check("sort kept in the URL", page.url().includes("sort=highest"), page.url());
await clickText(page, "button", "مسح الفلاتر");
await sleep(150);
R.check("clear filters resets the sort", !page.url().includes("sort=") && nums(await rowTexts(page)).join(",") === [order.orderNumber, 1012, 1010, 1011].join(","));

// ───────────── 4) تفاصيل الطلب ─────────────
await page.evaluate((n) => [...document.querySelectorAll("table tbody tr")].find((r) => r.innerText.includes(`#${n}`)).click(), order.orderNumber);
await page.waitForFunction(() => /\/admin\/orders\/o_/.test(location.pathname));
await waitText(page, "العميل");
const det = await page.evaluate(() => ({
  text: document.querySelector("main").innerText,
  h2: [...document.querySelectorAll("main section h2")].map((h) => h.textContent),
  tel: document.querySelector('a[href^="tel:"]')?.getAttribute("href"),
  wa: document.querySelector('a[href^="https://wa.me/"]')?.getAttribute("href"),
}));
R.check("details: grouped by day with Arabic labels", dates.every((d) => det.h2.includes(dayLabel(d))), det.h2.join(" | "));
R.check("details: addons, note, line totals shown", order.items.every((i) => det.text.includes(i.name) && det.text.includes(price(lineTotal(i))) && i.addons.every((a) => det.text.includes(a.name))) && det.text.includes("من غير بصل"));
R.check("details: subtotal/delivery/total", det.text.includes(price(order.subtotal)) && det.text.includes(price(order.deliveryFee)) && det.text.includes(price(order.totalPrice)));
R.check("details: tel link", det.tel === "tel:01012345678", det.tel);
R.check("details: WhatsApp link 2010...", det.wa === "https://wa.me/201012345678", det.wa);
await clickText(page, "a", "كل الطلبات");
await page.waitForFunction(() => location.pathname === "/admin/orders");
R.check("details: back link returns to list", true);

// ───────────── 4b) الكانبان والإجراءات الجماعية ─────────────
// 1. التبديل للكانبان
await clickText(page, "button", "لوحة");
await sleep(400);
const kanbanCols = await page.evaluate(() => [...document.querySelectorAll("h3")].map((h) => h.innerText));
R.check("kanban: 5 status columns present", ["جديد", "بيتحضر", "في الطريق", "تم التسليم", "ملغي"].every((s) => kanbanCols.includes(s)), kanbanCols.join(" | "));
// الحفظ في localStorage
await page.reload();
await sleep(500);
const viewInLs = await ls(page, "mamafood:admin:ordersView");
R.check("kanban: view persisted after reload", viewInLs === "kanban");

// كليك على كارت في الكانبان يفتح تفاصيل الطلب
await page.evaluate(() => document.querySelector('.bg-white[role="button"]')?.click());
await page.waitForFunction(() => /\/admin\/orders\/o_/.test(location.pathname));
await waitText(page, "كل الطلبات");
R.check("kanban: click card opens order details", true);
await clickText(page, "a", "كل الطلبات");
await page.waitForFunction(() => location.pathname === "/admin/orders");

// التبديل للموبايل (375px) لفحص التابات والشيت
await page.setViewport({ width: 375, height: 800 });
await sleep(400);
const mobileTabs = await page.$$eval('[role="tablist"][aria-label="حالات الطلبات"] button', (bs) => bs.map((b) => b.innerText));
R.check("kanban mobile: status tabs rendered", mobileTabs.length === 5, mobileTabs.join(" | "));
// فتح شيت تغيير الحالة على الموبايل
const canChangeMobile = await page.evaluate(() => [...document.querySelectorAll("button")].some((b) => b.textContent.includes("تغيير الحالة")));
if (canChangeMobile) {
  await clickText(page, "button", "تغيير الحالة");
  await sleep(400);
  const sheetOpen = await page.$('[role="dialog"]');
  R.check("kanban mobile: change status bottom sheet opens", !!sheetOpen);
  if (sheetOpen) { await page.keyboard.press("Escape"); await sleep(300); }
}

// رجّع الشاشة للديسكتوب والتبديل للقائمة
await page.setViewport({ width: 1280, height: 900 });
await sleep(400);
await clickText(page, "button", "قائمة");
await sleep(400);

// 2. الإجراءات الجماعية (Bulk Actions)
const selectAllBox = await page.$('th input[type="checkbox"]');
if (selectAllBox) {
  await selectAllBox.click();
  await sleep(300);
  const barText = await page.evaluate(() => document.querySelector(".bg-ink")?.innerText || "");
  R.check("bulk actions: sticky bar shows selected count", barText.includes("تم تحديد") || barText.includes("محدد"), barText);

  // فتح مودال اختيار الحالة
  await page.evaluate(() => [...document.querySelectorAll(".bg-ink button")].find((b) => b.textContent.includes("تغيير الحالة"))?.click());
  await sleep(400);
  await page.waitForSelector('[role="dialog"]');
  // اختيار حالة "بيتحضر"
  await page.evaluate(() => [...document.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent.includes("بيتحضر"))?.click());
  await sleep(400);
  // مودال التأكيد
  await clickText(page, "button", "نعم، تغيير الحالة", { root: "dialog" });
  await sleep(500);
  R.check("bulk actions: confirmation executed", true);
}

// ───────────── 5) ملخص التحضير ─────────────
const allOrders = await ls(page, "mamafood:db:orders");
for (const d of dates) {
  await page.goto(`${BASE}/admin/orders?tab=prep&day=${d}`);
  await waitText(page, `تحضير يوم ${dayLabel(d)}`);
  await page.waitForSelector("main section ul li");
  const shown = await page.evaluate(() => [...document.querySelectorAll("main section")].map((s) => ({
    title: s.querySelector("h3").textContent,
    rows: [...s.querySelectorAll("li")].map((li) => ({ q: +li.children[0].textContent, name: li.children[1].textContent })),
  })));
  const exp = { meals: {}, addons: {} };
  for (const o of allOrders) {
    if (o.status === "cancelled") continue;
    for (const x of o.items.filter((x) => x.date === d)) {
      exp.meals[x.name] = (exp.meals[x.name] || 0) + x.quantity;
      for (const a of x.addons) exp.addons[a.name] = (exp.addons[a.name] || 0) + x.quantity;
    }
  }
  const got = (t) => Object.fromEntries((shown.find((s) => s.title === t)?.rows || []).map((r) => [r.name, r.q]));
  const eq = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
  R.check(`prep ${dayLabel(d)}: meal totals match (cancelled excluded)`, eq(got("الوجبات"), exp.meals), JSON.stringify(got("الوجبات")));
  R.check(`prep ${dayLabel(d)}: addon totals match`, eq(got("الإضافات"), exp.addons), JSON.stringify(got("الإضافات")));
}

// ───────────── 6) الإضافات: إنشاء / تعديل / حذف ─────────────
await page.goto(BASE + "/admin/addons");
await waitText(page, "إضافة جديدة");
await page.waitForSelector('main input[type="search"]');
await clickText(page, "button", "إضافة جديدة");
await page.waitForSelector("#addon-form");
await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
await waitText(page, "اسم الإضافة مطلوب");
await page.type('#addon-form input[placeholder="مثال: سلطة خضرا"]', "صوص رانش");
await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
await waitText(page, "السعر مطلوب");
await page.type('#addon-form input[type="number"]', "-3");
await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
await waitText(page, "أقل من 0");
R.check("addon form: validation (name required, price required, >= 0)", true);
await page.click('#addon-form input[type="number"]', { clickCount: 3 });
await page.type('#addon-form input[type="number"]', "12");
await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
await waitText(page, 'تم إضافة "صوص رانش"');
let addons = await ls(page, "mamafood:db:addons");
R.check("addon created", addons.some((a) => a.name === "صوص رانش" && a.price === 12));
await page.waitForFunction((n) => [...document.querySelectorAll("table tbody tr")].some((r) => r.innerText.includes(n)), {}, "صوص رانش");
await page.evaluate(() => [...document.querySelectorAll("table tbody tr")].find((r) => r.innerText.includes("صوص رانش")).click());
await page.waitForSelector("#addon-form");
await page.click('#addon-form input[placeholder="مثال: سلطة خضرا"]', { clickCount: 3 });
await page.type('#addon-form input[placeholder="مثال: سلطة خضرا"]', "صوص رانش حار");
await page.click('#addon-form input[type="checkbox"]');
const priceState = await page.$eval('#addon-form input[type="number"]', (i) => ({ v: i.value, d: i.disabled }));
R.check("addon form: مجاني sets price 0 and disables field", priceState.v === "0" && priceState.d, JSON.stringify(priceState));
await page.evaluate(() => document.querySelector('button[form="addon-form"]').click());
await waitText(page, 'تم تعديل "صوص رانش حار"');
addons = await ls(page, "mamafood:db:addons");
const ranch = addons.find((a) => a.name === "صوص رانش حار");
R.check("addon edited (name + free)", ranch && ranch.price === 0);
await page.waitForFunction((n) => [...document.querySelectorAll("table tbody tr")].some((r) => r.innerText.includes(n)), {}, "صوص رانش حار");
const ranchRow = (await rowTexts(page)).find((r) => r.includes("صوص رانش حار")) || "";
R.check("free addon shows مجاني badge", ranchRow.includes("مجاني"), ranchRow.replace(/\n/g, " / "));
await page.evaluate(() => [...document.querySelectorAll("table tbody tr")].find((r) => r.innerText.includes("صوص رانش حار")).querySelector('button[aria-label^="حذف"]').click());
await page.waitForSelector('[role="dialog"]');
await clickText(page, "button", "نعم، احذف", { root: "dialog" });
await waitText(page, 'تم حذف "صوص رانش حار"');
R.check("addon deleted", !(await ls(page, "mamafood:db:addons")).some((a) => a.id === ranch.id));

// حذف إضافة مربوطة بوجبة ومستخدمة في الطلب
const usedAddon = order.items[0].addons[0];
const mealsBefore = await ls(page, "mamafood:db:meals");
const linkedCount = mealsBefore.filter((m) => m.addons.includes(usedAddon.id)).length;
const linkedRow = (await rowTexts(page)).find((r) => r.startsWith(usedAddon.name)) || "";
R.check("addons list: linked meals count", linkedRow.includes(`مربوطة بـ ${linkedCount} وجبة`), linkedRow.replace(/\n/g, " / "));
await page.evaluate((name) => [...document.querySelectorAll("table tbody tr")].find((r) => r.innerText.startsWith(name)).querySelector('button[aria-label^="حذف"]').click(), usedAddon.name);
await page.waitForSelector('[role="dialog"]');
const dlg = await page.$eval('[role="dialog"]', (d) => d.innerText);
R.check("delete modal warns مربوطة بـ X وجبة", dlg.includes(`مربوطة بـ ${linkedCount} وجبة`), `X=${linkedCount}`);
await clickText(page, "button", "نعم، احذف", { root: "dialog" });
await waitText(page, `تم حذف "${usedAddon.name}"`);
const mealsAfter = await ls(page, "mamafood:db:meals");
R.check("deleted addon removed from every meal", mealsAfter.every((m) => !m.addons.includes(usedAddon.id)));
await page.goto(`${BASE}/admin/orders/${order.id}`);
await waitText(page, "العميل");
R.check("old order still shows deleted addon", (await page.$eval("main", (m) => m.innerText)).includes(usedAddon.name), usedAddon.name);

// ───────────── 7) الإعدادات => الزبون ─────────────
await page.goto(BASE + "/admin/settings");
await page.waitForSelector("#orderCutoffHour");
const defaults = await page.evaluate(() => ({ mode: document.querySelector('input[name="cutoffMode"]:checked')?.value, hour: document.querySelector("#orderCutoffHour").value }));
R.check("settings default: same day at 12 م", defaults.mode === "same_day" && defaults.hour === "12", JSON.stringify(defaults));
// اليوم اللي قبله الساعة 12 ص
await clickText(page, "fieldset label", "اليوم اللي قبله");
await page.select("#orderCutoffHour", "0");
await page.click('input[type="number"]', { clickCount: 3 });
await page.type('input[type="number"]', "35");
const helper = await page.evaluate(() => document.querySelector("main").innerText);
R.check("settings helper line + live example", helper.includes("كل يوم بيتقفل الساعة 12 ص في اليوم اللي قبله") && helper.includes("12 منتصف الليل"));
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "تم حفظ الإعدادات");
let st = await ls(page, "mamafood:db:settings");
R.check("settings saved", st.cutoffMode === "day_before" && st.orderCutoffHour === 0 && st.deliveryAreas?.[0]?.price === 35 && !("deliveryFee" in st), JSON.stringify(st));
const chipsDisabled = async () => {
  await page.goto(BASE + "/");
  await page.waitForSelector("button[aria-pressed]");
  const disabled = await page.$$eval("button[aria-pressed]", (bs) => bs.map((b) => b.disabled));
  // الرئيسية بتنضّف السلة مرة بعد ما الأيام تتحمّل: نستنى قبل ما الاختبار يكتب سلة جديدة عشان ما تتكتبش فوقها
  await sleep(600);
  return disabled;
};
let cd = await chipsDisabled();
R.check("customer: day_before 12 ص locks today and tomorrow", cd[0] && cd[1] && !cd[2], JSON.stringify(cd.slice(0, 3)));

// نفس اليوم الساعة 11 م: النهارده مفتوح لحد 11 م وبكره مفتوح
await page.goto(BASE + "/admin/settings");
await page.waitForSelector("#orderCutoffHour");
await clickText(page, "fieldset label", "نفس اليوم");
await page.select("#orderCutoffHour", "23");
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "تم حفظ الإعدادات");
cd = await chipsDisabled();
const hourNow = new Date().getHours();
R.check("customer: same_day 11 م keeps today open until 11 م, tomorrow open", (hourNow >= 23 ? cd[0] : !cd[0]) && !cd[1], `now ${hourNow}h ${JSON.stringify(cd.slice(0, 2))}`);
// شيك آوت بالرسوم الجديدة
const cartItem = { ...order.items[1], date: dates[1] };
await setLs(page, "mamafood:cart", { state: { selectedDates: [dates[1]], items: [cartItem], customer: order.customer }, version: 0 });
await page.goto(BASE + "/checkout");
await page.waitForSelector('button[type="submit"]:not([disabled])', { timeout: 8000 });
const coText = await page.$eval("main", (m) => m.innerText).catch(() => page.$eval("body", (b) => b.innerText));
const expTotal = lineTotal(cartItem) + 35;
R.check("checkout shows new delivery fee 35 + total", coText.includes(price(35)) && coText.includes(price(expTotal)), `expected total ${expTotal}`);
await clickText(page, "button", "أكّد الطلب");
await page.waitForFunction(() => location.pathname.startsWith("/order-success/"), { timeout: 8000 });
const o2 = (await ls(page, "mamafood:db:orders"))[0];
R.check("new order stored with deliveryFee 35", o2.deliveryFee === 35 && o2.totalPrice === expTotal, JSON.stringify({ fee: o2.deliveryFee, total: o2.totalPrice }));

// ───────────── 7a) مناطق التوصيل: آخر منطقة مفعّلة محمية، منطقة جديدة بسعر، والزبون بيختار العنوان ─────────────
await page.goto(BASE + "/admin/settings");
await page.waitForSelector('input[name="deliveryAreas.0.enabled"]');
await clickText(page, "label", "مفعّلة");
await waitText(page, "لازم تفضل منطقة واحدة مفعّلة على الأقل");
R.check("settings: the last enabled area can't be turned off", await page.$eval('input[name="deliveryAreas.0.enabled"]', (i) => i.checked));
await clickText(page, "button", "إضافة منطقة");
await page.waitForSelector('input[name="deliveryAreas.1.name"]');
R.check("settings: new area row focuses its name", await page.evaluate(() => document.activeElement?.name === "deliveryAreas.1.name"));
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "اكتب اسم المنطقة");
await page.type('input[name="deliveryAreas.1.name"]', "كل المناطق");
await page.type('input[name="deliveryAreas.1.price"]', "0");
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "الاسم ده متكرر");
R.check("settings: area validation (name required, unique)", true);
await page.click('input[name="deliveryAreas.1.name"]', { clickCount: 3 });
await page.type('input[name="deliveryAreas.1.name"]', "المعادي");
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "تم حفظ الإعدادات");
st = await ls(page, "mamafood:db:settings");
const areaMaadi = st.deliveryAreas.find((a) => a.name === "المعادي");
R.check("settings: new area saved (2 enabled areas)", st.deliveryAreas.length === 2 && areaMaadi?.price === 0 && areaMaadi.enabled, JSON.stringify(st.deliveryAreas));

await setLs(page, "mamafood:cart", { state: { selectedDates: [dates[1]], items: [cartItem], customer: { ...order.customer, deliveryAreaId: "" } }, version: 0 });
await page.goto(BASE + "/checkout");
await page.waitForSelector("#deliveryAreaId");
const areaOpts = await page.$$eval("#deliveryAreaId option", (os) => os.map((o) => o.textContent));
R.check("checkout: العنوان lists enabled areas with their fee", areaOpts.join("|") === `اختار العنوان|كل المناطق — ${price(35)}|المعادي — توصيل مجاني`, areaOpts.join("|"));
R.check("checkout: summary asks to choose العنوان before an area is picked", (await page.$eval("main", (m) => m.innerText)).includes("اختار العنوان"));
await clickText(page, "button", "أكّد الطلب");
await waitText(page, "اختار العنوان");
await sleep(500);
R.check("checkout: submit blocked without an area", new URL(page.url()).pathname === "/checkout" && (await ls(page, "mamafood:db:orders"))[0].id === o2.id);
await page.select("#deliveryAreaId", areaMaadi.id);
await sleep(200);
const coArea = await page.$eval("main", (m) => m.innerText);
R.check("checkout: free area shows توصيل مجاني + total without delivery", coArea.includes("التوصيل (المعادي)") && coArea.includes("توصيل مجاني") && coArea.includes(price(lineTotal(cartItem))));
await clickText(page, "button", "أكّد الطلب");
await page.waitForFunction(() => location.pathname.startsWith("/order-success/"), { timeout: 8000 });
const o3 = (await ls(page, "mamafood:db:orders"))[0];
R.check("order stores the area snapshot and its fee", o3.deliveryArea?.id === areaMaadi.id && o3.deliveryArea?.name === "المعادي" && o3.deliveryFee === 0 && o3.totalPrice === lineTotal(cartItem), JSON.stringify({ area: o3.deliveryArea, fee: o3.deliveryFee, total: o3.totalPrice }));
await waitText(page, "بيانات التوصيل");
R.check("success page shows the area", (await page.$eval("main", (m) => m.innerText)).includes("المعادي"));

// ───────────── 7b) فودافون كاش: تفعيل => صورة التحويل إجبارية في صفحة الطلب => الطلب يتعمل معاها، والأدمن بيشوف الصورة بس ─────────────
await page.goto(BASE + "/admin/settings");
await page.waitForSelector('input[role="switch"]');
await clickText(page, "label", "تفعيل فودافون كاش");
await page.type('input[placeholder="01XXXXXXXXX"]', "01012345678");
await clickText(page, "button", "حفظ الإعدادات");
await waitText(page, "تم حفظ الإعدادات");
R.check("settings: Vodafone Cash enabled", (await ls(page, "mamafood:db:settings")).payments?.vodafoneCash?.enabled === true);
await setLs(page, "mamafood:cart", { state: { selectedDates: [dates[1]], items: [cartItem], customer: { ...order.customer, deliveryAreaId: areaMaadi.id }, paymentMethod: "cash" }, version: 0 });
await page.goto(BASE + "/checkout");
await page.waitForFunction(() => document.querySelectorAll('input[name="paymentMethod"]').length === 2 && !document.querySelector('button[type="submit"]').disabled);
await page.evaluate(() => document.querySelector('input[name="paymentMethod"][value="vodafone_cash"]').closest("label").click());
await waitText(page, "حوّل المبلغ وارفع صورة التحويل");
R.check("VC checkout: transfer box with the wallet number", await page.evaluate(() => [...document.querySelectorAll("main bdi")].some((b) => b.textContent === "01012345678")));
// من غير صورة: التأكيد ممنوع برسالة، ومفيش طلب بيتعمل
const ordersBeforeVc = (await ls(page, "mamafood:db:orders")).length;
await clickText(page, "button", "أكّد الطلب");
await waitText(page, "ارفع صورة التحويل عشان تكمّل");
await sleep(800);
R.check("VC checkout: submit blocked without screenshot (no order created)", new URL(page.url()).pathname === "/checkout" && (await ls(page, "mamafood:db:orders")).length === ordersBeforeVc);
const proofPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/assets/pattern.jpg");
await (await page.$('main input[type="file"]')).uploadFile(proofPath);
await waitText(page, "تغيير الصورة");
await clickText(page, "button", "أكّد الطلب");
// الطلب والصورة مع بعض => صفحة تأكيد الطلب الكاملة بتاعة الكاش (بالتفاصيل وسطر الدفع)
await page.waitForFunction(() => location.pathname.startsWith("/order-success/"), { timeout: 10000 });
const vcOrderId = page.url().split("/").pop();
await waitText(page, "بيانات التوصيل", 8000);
const successText = await page.evaluate(() => document.querySelector("main").innerText);
R.check("customer: lands on the full order success page with details + payment row", successText.includes("تم تأكيد طلبك!") && successText.includes("الإجمالي") && successText.includes("فودافون كاش") && successText.includes("وصل الإيصال") && !successText.includes("ارفع صورة التحويل"));
R.check("customer: no payment-confirmation wording", !(await page.evaluate(() => document.body.innerText.includes("تأكيد الدفع"))));
const vcOrder = (await ls(page, "mamafood:db:orders")).find((o) => o.id === vcOrderId);
R.check("VC order: created with its proof => confirmed (image stored outside orders)", vcOrder.payment.status === "confirmed" && !!vcOrder.payment.proofUploadedAt && !JSON.stringify(vcOrder).includes("data:image") && !!(await ls(page, "mamafood:db:paymentProofs"))[vcOrderId], vcOrder.payment.status);
// لينك صفحة الدفع القديمة => صفحة تأكيد الطلب
await page.goto(`${BASE}/payment/${vcOrderId}`);
await page.waitForFunction((id) => location.pathname === `/order-success/${id}`, { timeout: 8000 }, vcOrderId);
R.check("old /payment/:id link redirects to the order success page", true);
await page.goto(`${BASE}/admin/orders/${vcOrderId}`);
await page.waitForSelector('button[aria-label="عرض صورة الإيصال بحجم كبير"] img');
const adminCard = await page.evaluate(() => ({
  text: document.querySelector("main").innerText,
  buttons: [...document.querySelectorAll("main button")].map((b) => b.textContent.trim()),
}));
R.check("admin: screenshot + 'وصل الإيصال' badge shown", adminCard.text.includes("وصل الإيصال"));
R.check("admin: no approve/reject buttons", !adminCard.buttons.some((t) => /تأكيد الدفع|رفض الإيصال|إعادة المراجعة/.test(t)) && !adminCard.text.includes("تأكيد الدفع"), adminCard.buttons.join(" | "));
await page.goto(BASE + "/admin/orders");
await waitText(page, "وصل الإيصال");
R.check("admin orders: no 'مستني إيصال' anywhere", !(await page.evaluate(() => document.body.innerText.includes("مستني إيصال"))));

// رجّع الإعدادات
await setLs(page, "mamafood:db:settings", { cutoffMode: "same_day", orderCutoffHour: 12, deliveryFee: 20 });

// ───────────── 8) فاضي / تحميل / خطأ ─────────────
const backup = { orders: await ls(page, "mamafood:db:orders"), addons: await ls(page, "mamafood:db:addons") };
const busyAfterNav = async (path) => {
  await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  try { await page.waitForSelector('[aria-busy="true"]', { timeout: 3000 }); return true; } catch { return false; }
};
R.check("loading skeleton: addons", await busyAfterNav("/admin/addons"));
R.check("loading skeleton: orders", await busyAfterNav("/admin/orders"));
R.check("loading skeleton: order details", await busyAfterNav(`/admin/orders/${order.id}`));
R.check("loading skeleton: prep", await (async () => { await page.goto(BASE + "/admin/orders?tab=prep", { waitUntil: "domcontentloaded" }); try { await page.waitForSelector('[aria-busy="true"]', { timeout: 3000 }); return true; } catch { return false; } })());
R.check("loading skeleton: settings", await busyAfterNav("/admin/settings"));

await setLs(page, "mamafood:db:orders", []);
await setLs(page, "mamafood:db:addons", []);
await page.goto(BASE + "/admin/orders"); await waitText(page, "لسه مفيش طلبات");
R.check("empty: orders", true);
await page.goto(BASE + "/admin/orders?tab=prep"); await waitText(page, "مفيش طلبات لليوم ده");
R.check("empty: prep", true);
await page.goto(BASE + "/admin/addons"); await waitText(page, "لسه مفيش إضافات");
R.check("empty: addons", true);
await setLs(page, "mamafood:db:orders", backup.orders);
await setLs(page, "mamafood:db:addons", backup.addons);
await page.goto(BASE + "/admin/orders?q=zzzz"); await waitText(page, "مفيش نتايج");
R.check("empty: no matching orders", true);
await page.goto(BASE + "/admin/orders/o_doesnotexist"); await waitText(page, "تعذر تحميل الطلب", 8000);
R.check("error: order not found", true);

// خطأ: localStorage بيرفض الكتابة/القراءة للمفتاح ده => الـ API بيرمي
const errPage = await browser.newPage();
await errPage.setViewport({ width: 1280, height: 900 });
const errLogs = [];
watchConsole(errPage, errLogs);
await errPage.evaluateOnNewDocument(() => {
  const fail = (k) => /mamafood:db:(orders|addons|settings)$/.test(k);
  const gi = Storage.prototype.getItem, si = Storage.prototype.setItem;
  Storage.prototype.getItem = function (k) { if (fail(k)) throw new Error("storage down"); return gi.call(this, k); };
  Storage.prototype.setItem = function (k, v) { if (fail(k)) throw new Error("storage down"); return si.call(this, k, v); };
});
for (const [path, text] of [["/admin/addons", "تعذر تحميل الإضافات"], ["/admin/orders", "تعذر تحميل الطلبات"], ["/admin/settings", "تعذر تحميل الإعدادات"], [`/admin/orders/${order.id}`, "تعذر تحميل الطلب"]]) {
  await errPage.goto(BASE + path);
  try { await waitText(errPage, text, 8000); R.check(`error state: ${path}`, (await errPage.$$('button')).length > 0); }
  catch { R.check(`error state: ${path}`, false); }
}
await errPage.close();

// ───────────── placeholders ─────────────
for (const p of ["/admin/addons", "/admin/orders", "/admin/settings"]) {
  await page.goto(BASE + p); await sleep(800);
  R.check(`no Phase-2 placeholder on ${p}`, !(await page.evaluate(() => document.body.innerText.includes("هتتبني"))));
}

console.log("\nCONSOLE (errors/warnings):", consoleLog.length ? "\n" + consoleLog.join("\n") : "none");
console.log(`\n${R.rows.length - R.failed.length}/${R.rows.length} passed`);
await browser.close();
process.exit(R.failed.length ? 1 : 0);
