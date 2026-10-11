import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";
import { seedMeals } from "./seed";

const read = () => db.read("meals", seedMeals);

export const mealsApi = {
  list: () => (USE_MOCK ? simulate(read) : http("/meals")),
  create: (meal) =>
    USE_MOCK
      ? simulate(() => { const m = { id: uid("m"), isAvailable: true, addons: [], image: null, ...meal }; db.write("meals", [...read(), m]); return m; })
      : http("/admin/meals", { method: "POST", body: meal }),
  update: (id, patch) =>
    USE_MOCK
      ? simulate(() => { const all = read().map((m) => (m.id === id ? { ...m, ...patch } : m)); db.write("meals", all); return all.find((m) => m.id === id); })
      : http(`/admin/meals/${id}`, { method: "PUT", body: patch }),
  remove: (id) =>
    USE_MOCK
      ? simulate(() => { db.write("meals", read().filter((m) => m.id !== id)); return { id }; })
      : http(`/admin/meals/${id}`, { method: "DELETE" }),
  delete: (id) => mealsApi.remove(id),
};

