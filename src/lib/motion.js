/**
 * إعدادات الحركة المشتركة. القاعدة: transform و opacity بس، وقصيرة عشان ما تأخرش المستخدم.
 */
export const springs = {
  // مودال وشيت ودرور
  overlay: { type: "spring", stiffness: 420, damping: 36, mass: 0.9 },
  // حاجات صغيرة (بادج، رقم، شريحة)
  pop: { type: "spring", stiffness: 520, damping: 24 },
};

export const fade = { duration: 0.18, ease: "easeOut" };

/** دخول الصفحة: fade + طلوع خفيف لفوق (رأسي، فمفيش مشكلة اتجاه RTL) */
export const pageEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: "easeOut" },
};

/** دخول الكروت بتتابع خفيف (أقصى تأخير 8 عناصر عشان القوايم الطويلة ما تستناش) */
export const cardEnter = (index = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: "easeOut", delay: Math.min(index, 8) * 0.04 },
});
