export const BRAND = { name: "MAMA FOOD", tagline: "Home Made Food", taglineAr: "أكل بيتي" };

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]; // مطابق لـ Date.getDay()

export const DAY_NAMES_AR = {
  sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء", wed: "الأربعاء",
  thu: "الخميس", fri: "الجمعة", sat: "السبت",
};

export const ORDER_STATUS = {
  new: { label: "جديد", tone: "red" },
  preparing: { label: "بيتحضر", tone: "yellow" },
  delivering: { label: "في الطريق", tone: "blue" },
  done: { label: "تم التسليم", tone: "green" },
  cancelled: { label: "ملغي", tone: "gray" },
};
export const ORDER_STATUS_FLOW = ["new", "preparing", "delivering", "done"];

export const MEAL_CATEGORIES = {
  main: "أطباق رئيسية", rice: "أرز ومكرونة", stuffed: "محشي", grill: "مشويات", dessert: "حلويات",
};

export const UPCOMING_DAYS_COUNT = 7; // 7 أيام تبدأ من بكره
export const PHONE_REGEX = /^01[0125][0-9]{8}$/; // موبايل مصري
