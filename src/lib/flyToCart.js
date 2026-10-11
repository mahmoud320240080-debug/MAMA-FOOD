import iconYellow from "@/assets/icon-yellow.png";
import { prefersReducedMotion } from "@/hooks/useReducedMotion";
import { BRAND_COLORS, withAlpha } from "@/lib/brandColors";

/**
 * "Fly to Cart": نسخة صغيرة من صورة الوجبة (أو دايرة حمرا عليها الـ M) بتطير من الزرار لأيقونة السلة.
 * - Web Animations API (transform + opacity بس) — من غير مكتبة.
 * - طبقة fixed و overflow:hidden => مفيش سكرول أفقي حتى وقت الطيران، وشغالة والصفحة متسكرلة.
 * - أقصى 3 في نفس الوقت (الضغط السريع ما يكوّمش عناصر). العدّاد نفسه بيتحدث من الستور مش من هنا.
 * - مع "تقليل الحركة": مفيش طيران خالص.
 *
 * الهدف: عنصر عليه data-cart-target="desktop" (الناف بار) أو "mobile" (البوتوم ناف)،
 * وجواه عنصر data-cart-bump اللي بيعمل bounce لما الوجبة توصل.
 */
const MAX_FLYING = 3;
const DURATION = 620;
let flying = 0;

function layer() {
  let el = document.getElementById("fly-layer");
  if (!el) {
    el = document.createElement("div");
    el.id = "fly-layer";
    el.setAttribute("aria-hidden", "true");
    Object.assign(el.style, { position: "fixed", inset: "0", pointerEvents: "none", overflow: "hidden", zIndex: "70" });
    document.body.appendChild(el);
  }
  return el;
}

const isVisible = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(el).visibility !== "hidden";
};

export function findCartTarget() {
  const want = window.innerWidth >= 768 ? "desktop" : "mobile";
  const all = [...document.querySelectorAll("[data-cart-target]")].filter(isVisible);
  // على الموبايل لو البوتوم ناف مستخبي (الكيبورد مفتوح) نرجع للناف بار
  return all.find((el) => el.dataset.cartTarget === want) || all[0] || null;
}

/** bounce صغير لأيقونة السلة */
export function bumpCart(target = findCartTarget()) {
  if (!target || prefersReducedMotion()) return;
  const el = target.querySelector("[data-cart-bump]") || target;
  el.animate?.(
    [{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(0.94)" }, { transform: "scale(1)" }],
    { duration: 380, easing: "ease-out" }
  );
}

export function flyToCart(fromEl, { image } = {}) {
  if (!fromEl || typeof document === "undefined" || prefersReducedMotion()) return;
  const target = findCartTarget();
  if (!target) return;
  if (flying >= MAX_FLYING || !fromEl.isConnected) { bumpCart(target); return; }

  const from = fromEl.getBoundingClientRect();
  const to = (target.querySelector("[data-cart-bump]") || target).getBoundingClientRect();
  const size = 44;
  const x0 = from.left + from.width / 2 - size / 2;
  const y0 = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (x0 + size / 2);
  const dy = to.top + to.height / 2 - (y0 + size / 2);
  // قوس: بيطلع لفوق الأول وبعدين ينزل/يطلع للسلة
  const lift = Math.min(0, dy) * 0.5 - 56;

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "absolute", left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px`,
    borderRadius: "9999px", overflow: "hidden", background: BRAND_COLORS.red, display: "grid", placeItems: "center",
    boxShadow: `0 8px 20px -6px ${withAlpha(BRAND_COLORS.red, 0.6)}`, border: "2px solid #fff", willChange: "transform, opacity",
  });
  const img = document.createElement("img");
  img.alt = "";
  img.src = image || iconYellow;
  Object.assign(img.style, image ? { width: "100%", height: "100%", objectFit: "cover" } : { width: "60%", height: "auto" });
  dot.appendChild(img);
  layer().appendChild(dot);
  flying++;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    flying--;
    dot.remove();
    bumpCart(target);
  };
  const anim = dot.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${lift}px) scale(0.85)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.35)`, opacity: 0.5 },
    ],
    { duration: DURATION, easing: "cubic-bezier(.4,0,.6,1)", fill: "forwards" }
  );
  anim.onfinish = finish;
  anim.oncancel = finish;
  setTimeout(finish, DURATION + 400); // أمان: ما يفضلش عنصر عالق
}
