import { API_URL } from "./config";

const TOKEN_KEY = "mamafood:token";
export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/**
 * عميل HTTP بسيط للباك الحقيقي. بيتستخدم بس لما USE_MOCK = false
 * body ممكن يكون FormData (رفع ملفات multipart): ساعتها المتصفح بيحط الـ Content-Type والـ boundary بنفسه.
 */
export async function http(path, { method = "GET", body, params } = {}) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const token = tokenStorage.get();
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_URL}${path}${qs}`, {
    method,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.message || "حصلت مشكلة، حاول تاني");
    err.status = res.status;
    throw err;
  }
  return data;
}
