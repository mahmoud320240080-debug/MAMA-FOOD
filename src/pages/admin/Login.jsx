import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@/api";
import { useAdminStore } from "@/store/useAdminStore";
import { LogoFull } from "@/components/common/Logo";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { toast } from "@/store/useToastStore";

const loginSchema = z.object({
  email: z.string().min(1, "الإيميل مطلوب").email("صيغة الإيميل غير صحيحة"),
  password: z.string().min(1, "الباسورد مطلوب"),
});

export default function Login() {
  const adminToken = useAdminStore((s) => s.adminToken);
  const setToken = useAdminStore((s) => s.setToken);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@mamafood.com",
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => adminApi.login(data.email, data.password),
    onSuccess: (data) => {
      setToken(data.token);
      const destination = location.state?.from?.pathname || "/admin/dashboard";
      navigate(destination, { replace: true });
    },
    onError: (e) => {
      toast.error(e.message || "الإيميل أو الباسورد غلط");
    },
  });

  if (adminToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-chef-pattern p-4 pb-safe pt-safe">
      <div className="w-full max-w-sm rounded-4xl bg-cream p-6 shadow-soft md:p-8">
        <LogoFull tone="onLight" priority className="mx-auto mb-6 w-44" />
        <h1 className="mb-4 text-center text-xl font-extrabold text-ink">
          تسجيل دخول لوحة التحكم
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="الإيميل"
            type="email"
            inputMode="email"
            dir="ltr"
            autoComplete="username"
            placeholder="admin@mamafood.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="الباسورد"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            placeholder="••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button
            type="submit"
            block
            size="lg"
            loading={mutation.isPending}
            className="mt-2 min-h-[48px]"
          >
            دخول
          </Button>
        </form>

        <div className="mt-5 rounded-2xl bg-brand-yellow-soft p-3.5 text-center text-sm font-semibold text-ink">
          <p>هذه بيانات وهمية للتجربة فقط — استخدم:</p>
          <p dir="ltr" className="mt-1 font-extrabold text-ink">
            admin@mamafood.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
}
