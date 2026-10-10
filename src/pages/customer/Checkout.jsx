import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ordersApi, calcOrderTotal, menuApi, WHATSAPP_NUMBER } from "@/api";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import OrderSummary from "@/components/customer/OrderSummary";
import { PHONE_REGEX } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cartSubtotal } from "@/lib/cart";
import { MessageCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "الاسم لازم يكون حرفين على الأقل"),
  phone: z.string().regex(PHONE_REGEX, "رقم الموبايل مش صح (مثال: 01012345678)"),
  address: z.string().min(5, "العنوان لازم يكون 5 حروف على الأقل"),
  notes: z.string().optional(),
});

export default function Checkout() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const customer = useCartStore((s) => s.customer);
  const saveCustomer = useCartStore((s) => s.saveCustomer);
  const clearCart = useCartStore((s) => s.clearCart);

  // لو السلة فاضية روح للرئيسية
  useEffect(() => {
    if (items.length === 0) navigate("/", { replace: true });
  }, [items.length, navigate]);

  // جيب الإعدادات (رسوم التوصيل)
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: menuApi.getSettings,
  });
  const deliveryFee = settings?.deliveryFee ?? 0;

  // جيب الأيام الجاية للتحقق قبل الإرسال
  const { data: upcomingDays } = useQuery({
    queryKey: ["upcoming"],
    queryFn: menuApi.getUpcoming,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      ordersApi.create({
        customer: { name: data.name, phone: data.phone, address: data.address, notes: data.notes },
        items,
        deliveryFee,
      }),
    onSuccess: (order) => {
      saveCustomer({
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        notes: order.customer.notes,
      });
      clearCart();
      navigate(`/order-success/${order.id}`, { replace: true });
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة، حاول تاني"),
  });

  const onSubmit = (data) => {
    // تحقق إن كل الأيام لسه مفتوحة
    if (upcomingDays) {
      const itemDates = [...new Set(items.map((it) => it.date))];
      const closedDates = itemDates.filter((d) => {
        const day = upcomingDays.find((dd) => dd.date === d);
        return !day || day.isClosed;
      });
      if (closedDates.length > 0) {
        toast.error("بعض الأيام اتقفلت. ارجع للرئيسية وعدّل طلبك.");
        return;
      }
    }
    mutation.mutate(data);
  };

  // WhatsApp link
  const waUrl = useMemo(() => {
    if (items.length === 0) return "#";
    return buildWhatsAppUrl(WHATSAPP_NUMBER, {
      items,
      customer: { name: customer.name || "—", phone: customer.phone || "—", address: customer.address || "—", notes: customer.notes },
      deliveryFee,
    });
  }, [items, customer, deliveryFee]);

  const total = cartSubtotal(items) + deliveryFee;

  if (items.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold md:text-3xl">إتمام الطلب</h1>

      <div className="gap-8 lg:grid lg:grid-cols-[1fr_380px]">
        {/* ═══ الملخص (موبايل: collapsible فوق الفورم) ═══ */}
        <div className="mb-6 lg:order-2 lg:mb-0">
          <div className="lg:sticky lg:top-24">
            <div className="lg:hidden">
              <OrderSummary items={items} deliveryFee={deliveryFee} collapsible />
            </div>
            <div className="hidden lg:block">
              <OrderSummary items={items} deliveryFee={deliveryFee} />
            </div>
          </div>
        </div>

        {/* ═══ الفورم ═══ */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 lg:order-1"
        >
          <div className="rounded-3xl bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-xl font-bold">بياناتك</h2>
            <div className="space-y-4">
              <Input
                label="الاسم"
                placeholder="اسمك الكامل"
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="رقم الموبايل"
                placeholder="01012345678"
                inputMode="tel"
                dir="ltr"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <Input
                label="العنوان"
                placeholder="العنوان بالتفصيل"
                error={errors.address?.message}
                {...register("address")}
              />
              <Input
                as="textarea"
                label="ملاحظات (اختياري)"
                placeholder="أي تعليمات إضافية..."
                {...register("notes")}
              />
            </div>
          </div>

          {/* طريقة الدفع */}
          <div className="rounded-3xl bg-white p-5 shadow-soft">
            <h2 className="mb-2 text-xl font-bold">الدفع</h2>
            <p className="text-ink-soft">💵 الدفع عند الاستلام (كاش)</p>
          </div>

          {/* الإجمالي وأزرار */}
          <div className="space-y-3 pb-safe">
            <div className="flex items-center justify-between rounded-3xl bg-brand-red px-5 py-4 text-lg font-extrabold text-white">
              <span>الإجمالي</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Button type="submit" block size="lg" loading={mutation.isPending}>
              أكّد الطلب
            </Button>

            <Button
              as="a"
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              block
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              تواصل عن طريق واتساب
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
