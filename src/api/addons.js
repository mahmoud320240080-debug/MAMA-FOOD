import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";
import { seedAddons, seedMeals } from "./seed";

const read = () => db.read("addons", seedAddons);

/**
 * ملحوظة: الطلبات القديمة مش بتتأثر بتعديل أو حذف إضافة،
 * لأن كل CartItem شايل نسخة من اسم وسعر الإضافة وقت الطلب.
 */

export const addonsApi = {
  list: () => (USE_MOCK ? simulate(read) : http("/addons")),
  create: (addon) =>
    USE_MOCK
      ? simulate(() => { const a = { id: uid("ad"), price: 0, ...addon }; db.write("addons", [...read(), a]); return a; })
      : http("/admin/addons", { method: "POST", body: addon }),
  update: (id, patch) =>
    USE_MOCK
      ? simulate(() => { const all = read().map((a) => (a.id === id ? { ...a, ...patch } : a)); db.write("addons", all); return all.find((a) => a.id === id); })
      : http(`/admin/addons/${id}`, { method: "PUT", body: patch }),
  remove: (id) =>
    USE_MOCK
      ? simulate(() => {
          db.write("addons", read().filter((a) => a.id !== id));
          // الباك بيعمل نفس الحاجة: يشيل الإضافة من addons بتاعة كل الوجبات
          const meals = db.read("meals", seedMeals);
          db.write("meals", meals.map((m) => (m.addons?.includes(id) ? { ...m, addons: m.addons.filter((x) => x !== id) } : m)));
          return { id };
        })
      : http(`/admin/addons/${id}`, { method: "DELETE" }),
  delete: (id) => addonsApi.remove(id),
};

