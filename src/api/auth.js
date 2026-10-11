import { USE_MOCK } from "./config";
import { http } from "./http";
import { simulate } from "./mockDb";
import { DEMO_ADMIN } from "./seed";

// ⚠️ تسجيل دخول وهمي للديمو فقط. الحماية الحقيقية لازم تكون على الباك.
export const authApi = {
  login: (arg1, arg2) => {
    let email, password;
    if (typeof arg1 === "object" && arg1 !== null) {
      email = arg1.email;
      password = arg1.password;
    } else {
      email = arg1;
      password = arg2;
    }

    return USE_MOCK
      ? simulate(() => {
          if (
            email === "admin@mamafood.com" &&
            (password === "123456" || password === DEMO_ADMIN.password)
          ) {
            return { token: "demo-token", user: { name: "ماما", email } };
          }
          throw new Error("الإيميل أو الباسورد غلط");
        }, 400)
      : http("/admin/login", { method: "POST", body: { email, password } });
  },
};

export const adminApi = authApi;

