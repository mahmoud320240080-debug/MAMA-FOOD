import { USE_MOCK } from "./config";
import { http } from "./http";
import { db, simulate, uid } from "./mockDb";
import { seedAddons } from "./seed";

const read = () => db.read("addons", seedAddons);

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
      ? simulate(() => { db.write("addons", read().filter((a) => a.id !== id)); return { id }; })
      : http(`/admin/addons/${id}`, { method: "DELETE" }),
};
