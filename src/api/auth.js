import { USE_MOCK } from "./config";
import { http } from "./http";
import { simulate } from "./mockDb";
import { DEMO_ADMIN } from "./seed";

// ⚠️ تسجيل دخول وهمي للديمو فقط. الحماية الحقيقية لازم تكون على الباك.
export const authApi = {
  login: ({ email, password }) =>
    USE_MOCK
      ? simulate(() => {
          if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password)
            return { token: "demo-token", user: { name: "ماما", email } };
          throw new Error("الإيميل أو الباسورد غلط");
        }, 500)
      : http("/admin/login", { method: "POST", body: { email, password } }),
};
