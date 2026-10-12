import { PHONE_REGEX } from "./constants";

/**
 * قواعد الدفع — مصدر واحد للـ API (الموك) والواجهة.
 * طرق الدفع الإلكتروني: فودافون كاش وإنستاباي (تحويل + صورة إيصال). الكاش متاح دايماً.
 */
export const ELECTRONIC_METHODS = ["vodafone_cash", "instapay"];
export const isElectronicPayment = (method) => ELECTRONIC_METHODS.includes(method);

/** عنوان إنستاباي زي name@instapay */
export const INSTAPAY_ADDRESS_REGEX = /^[a-z0-9._-]+@instapay$/i;

export const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PROOF_MAX_BYTES = 10 * 1024 * 1024;

/**
 * الدفع الافتراضي لطلب (أو طلب قديم من قبل طرق الدفع).
 * التحويل الإلكتروني صورته بتترفع مع الطلب نفسه => "confirmed" من أول لحظة.
 */
export const defaultPayment = (method) => ({
  status: isElectronicPayment(method) ? "confirmed" : "not_required",
  proofUploadedAt: null,
});

/** وجهة التحويل من الإعدادات: { value: الرقم أو عنوان إنستاباي، accountName } */
export const paymentDestination = (method, settings) => {
  const p = settings?.payments;
  if (method === "vodafone_cash") return { value: p?.vodafoneCash?.number || "", accountName: p?.vodafoneCash?.accountName || "" };
  if (method === "instapay") return { value: p?.instapay?.handle || "", accountName: p?.instapay?.accountName || "" };
  return null;
};

const destinationError = (method, value) => {
  const v = (value || "").trim();
  if (method === "vodafone_cash") return PHONE_REGEX.test(v) ? null : "رقم فودافون كاش لازم يكون موبايل مصري (مثال: 01012345678)";
  if (!v) return "اكتب رقم أو عنوان إنستاباي";
  return PHONE_REGEX.test(v) || INSTAPAY_ADDRESS_REGEX.test(v) ? null : "اكتب موبايل مصري (01XXXXXXXXX) أو عنوان زي name@instapay";
};

/** أخطاء إعدادات الدفع (للطرق المفعّلة بس): { vodafoneCash?, instapay? } */
export const validatePaymentSettings = (payments) => {
  const errors = {};
  if (payments?.vodafoneCash?.enabled) {
    const e = destinationError("vodafone_cash", payments.vodafoneCash.number);
    if (e) errors.vodafoneCash = e;
  }
  if (payments?.instapay?.enabled) {
    const e = destinationError("instapay", payments.instapay.handle);
    if (e) errors.instapay = e;
  }
  return errors;
};

/** الطرق اللي الزبون يشوفها: الكاش دايماً + أي طريقة مفعّلة ورقمها/عنوانها سليم */
export const availablePaymentMethods = (settings) => [
  "cash",
  ...ELECTRONIC_METHODS.filter((m) => {
    const cfg = m === "vodafone_cash" ? settings?.payments?.vodafoneCash : settings?.payments?.instapay;
    return cfg?.enabled && !destinationError(m, paymentDestination(m, settings).value);
  }),
];

/** صورة الإيصال: نوع وحجم (قبل الضغط) */
export const validateProofFile = (file) => {
  if (!file) return "اختار صورة الإيصال الأول";
  if (!PROOF_TYPES.includes(file.type)) return "الملف لازم يكون صورة JPG أو PNG أو WebP";
  if (file.size > PROOF_MAX_BYTES) return "الصورة أكبر من 10 ميجا. خد سكرين شوت أصغر وجرّب تاني";
  return null;
};
