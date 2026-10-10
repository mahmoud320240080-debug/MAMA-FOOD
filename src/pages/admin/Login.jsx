import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/api";
import { useAuthStore } from "@/store/useAuthStore";
import { LogoFull } from "@/components/common/Logo";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { toast } from "@/store/useToastStore";

export default function Login() {
  const { token, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => { login(data); navigate(location.state?.from?.pathname || "/admin/orders", { replace: true }); },
    onError: (e) => toast.error(e.message),
  });

  if (token) return <Navigate to="/admin/orders" replace />;

  return (
    <div className="grid min-h-dvh place-items-center bg-chef-pattern p-4 pb-safe pt-safe">
      <div className="w-full max-w-sm rounded-4xl bg-cream p-6 shadow-soft">
        <LogoFull tone="onLight" className="mx-auto mb-6 w-44" />
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}>
          <Input label="الإيميل" type="email" inputMode="email" autoComplete="username" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="الباسورد" type="password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button type="submit" block loading={mutation.isPending}>دخول</Button>
        </form>
        <p className="mt-4 rounded-2xl bg-brand-yellow-soft p-3 text-center text-sm">
          نسخة تجريبية: <span dir="ltr" className="font-semibold">admin@mamafood.com / admin123</span>
        </p>
      </div>
    </div>
  );
}
