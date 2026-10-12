// داتا أولية للديمو. الصور فاضية (image: null) لحد ما صاحب الأكل يرفع صور حقيقية.
export const seedAddons = () => [
  { id: "ad_ketchup", name: "كاتشب", price: 0 },
  { id: "ad_salad", name: "سلطة", price: 0 },
  { id: "ad_pickles", name: "مخلل", price: 0 },
  { id: "ad_tahini", name: "طحينة", price: 0 },
  { id: "ad_hot", name: "شطة", price: 0 },
  { id: "ad_rice", name: "أرز زيادة", price: 15 },
  { id: "ad_bread", name: "عيش زيادة", price: 5 },
  { id: "ad_cola", name: "مشروب غازي", price: 15 },
];

export const seedMeals = () => [
  { id: "m_koshary", name: "كشري", description: "كشري بيتي بالصلصة الحارة والدقة والتقلية.", price: 60, category: "rice", image: null, isAvailable: true, addons: ["ad_hot", "ad_salad", "ad_pickles", "ad_bread"] },
  { id: "m_mahshi", name: "محشي مشكل", description: "كرنب وورق عنب وفلفل وكوسة محشية أرز بالخلطة.", price: 110, category: "stuffed", image: null, isAvailable: true, addons: ["ad_salad", "ad_pickles", "ad_rice"] },
  { id: "m_chicken", name: "فراخ مشوية", description: "ربع فراخ متتبلة ومشوية بالفرن مع أرز بالشعرية.", price: 120, category: "grill", image: null, isAvailable: true, addons: ["ad_tahini", "ad_salad", "ad_pickles", "ad_hot", "ad_rice"] },
  { id: "m_kofta", name: "كفتة بالصلصة", description: "كفتة مفرومة بالبقدونس في صلصة طماطم مع أرز.", price: 130, category: "main", image: null, isAvailable: true, addons: ["ad_salad", "ad_rice", "ad_bread", "ad_hot"] },
  { id: "m_bechamel", name: "مكرونة بشاميل", description: "مكرونة بالبشاميل واللحمة المفرومة ومحمرة بالفرن.", price: 90, category: "rice", image: null, isAvailable: true, addons: ["ad_salad", "ad_pickles", "ad_ketchup"] },
  { id: "m_molokhia", name: "ملوخية بالفراخ", description: "ملوخية خضرا بالتقلية مع فراخ مسبكة وأرز.", price: 100, category: "main", image: null, isAvailable: true, addons: ["ad_rice", "ad_bread", "ad_pickles"] },
  { id: "m_burger", name: "برجر بيتي", description: "برجر لحمة متتبل بيتي مع بطاطس.", price: 95, category: "grill", image: null, isAvailable: true, addons: ["ad_ketchup", "ad_salad", "ad_hot", "ad_cola"] },
  { id: "m_roz_laban", name: "أرز بلبن", description: "أرز بلبن بالقشطة والمكسرات.", price: 35, category: "dessert", image: null, isAvailable: true, addons: [] },
];

// القالب الأسبوعي الثابت (الأدمن يعدّل عليه). بيتكرر كل أسبوع.
export const seedWeeklyMenu = () => ({
  sun: ["m_koshary", "m_chicken", "m_roz_laban"],
  mon: ["m_mahshi", "m_kofta", "m_roz_laban"],
  tue: ["m_bechamel", "m_chicken", "m_koshary"],
  wed: ["m_molokhia", "m_kofta", "m_roz_laban"],
  thu: ["m_mahshi", "m_chicken", "m_bechamel"],
  fri: ["m_molokhia", "m_burger", "m_roz_laban"],
  sat: ["m_koshary", "m_kofta", "m_burger"],
});

export const seedSettings = () => ({
  cutoffMode: "same_day", // كل يوم بيتقفل في نفس اليوم...
  orderCutoffHour: 12, // ...الساعة 12 الضهر
  deliveryFee: 20,
  // الدفع الإلكتروني مقفول لحد ما صاحب الأكل يحط رقمه من الإعدادات (الكاش متاح دايماً)
  payments: {
    vodafoneCash: { enabled: false, number: "", accountName: "" },
    instapay: { enabled: false, handle: "", accountName: "" },
    instructions: "",
  },
});

export const DEMO_ADMIN = { email: "admin@mamafood.com", password: "admin123" }; // ديمو فقط
