/**
 * نسخ نص: Clipboard API في الصفحات الآمنة (HTTPS/localhost)، وغير كده execCommand كحل احتياطي.
 * بيرجع true لو اتنسخ — لو false الواجهة بتطلب من الزبون ينسخ يدوي.
 */
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* مرفوض (صلاحيات/متصفح قديم) => الحل الاحتياطي */ }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  Object.assign(ta.style, { position: "fixed", top: "0", opacity: "0" });
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch { /* مش مدعوم */ }
  ta.remove();
  return ok;
}
