// "قاعدة بيانات" وهمية على localStorage. الطلب اللي الزبون يعمله يظهر عند الأدمن (نفس المتصفح).
const PREFIX = "mamafood:db:";
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

export const db = {
  read(key, seed) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    const initial = typeof seed === "function" ? seed() : seed;
    localStorage.setItem(PREFIX + key, JSON.stringify(initial));
    return initial;
  },
  write(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return value;
  },
  reset() {
    Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k));
  },
};

/** بيحاكي زمن الشبكة عشان نشوف الـ Skeleton والـ Loading */
export const simulate = async (fn, ms) => { await delay(ms); return fn(); };
export const uid = (p = "id") => `${p}_${Math.random().toString(36).slice(2, 9)}`;
