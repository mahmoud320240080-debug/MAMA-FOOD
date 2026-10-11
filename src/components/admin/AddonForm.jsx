import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addonsApi } from "@/api";
import Modal from "@/components/common/Modal";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { toast } from "@/store/useToastStore";

const normalize = (s) => s.trim().toLowerCase();

/** price بيوصل string من الـ input، أو undefined لما الحقل disabled (مجاني) */
const buildSchema = (takenNames) =>
  z
    .object({
      name: z.string().trim().min(1, "اسم الإضافة مطلوب").max(50, "الاسم طويل أوي (50 حرف بالكتير)"),
      isFree: z.boolean(),
      price: z.union([z.string(), z.number()]).optional(),
    })
    .superRefine((v, ctx) => {
      if (takenNames.has(normalize(v.name))) {
        ctx.addIssue({ code: "custom", path: ["name"], message: "فيه إضافة بنفس الاسم" });
      }
      if (v.isFree) return;
      const raw = typeof v.price === "string" ? v.price.trim() : v.price;
      if (raw === "" || raw === undefined) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "السعر مطلوب (أو علّم على مجاني)" });
      } else if (!Number.isFinite(Number(raw))) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "السعر لازم يكون رقم" });
      } else if (Number(raw) < 0) {
        ctx.addIssue({ code: "custom", path: ["price"], message: "السعر مينفعش يكون أقل من 0" });
      }
    })
    .transform((v) => ({ name: v.name, price: v.isFree ? 0 : Number(v.price) }));

export default function AddonForm({ open, onClose, addon, addons = [] }) {
  const queryClient = useQueryClient();
  const isEdit = !!addon?.id;

  const schema = useMemo(
    () => buildSchema(new Set(addons.filter((a) => a.id !== addon?.id).map((a) => normalize(a.name)))),
    [addons, addon]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setFocus,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: addon?.name || "",
      isFree: isEdit ? addon.price === 0 : false,
      price: isEdit ? String(addon.price) : "",
    },
  });
  const isFree = watch("isFree");

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? addonsApi.update(addon.id, data) : addonsApi.create(data)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming"] });
      toast.success(isEdit ? `تم تعديل "${saved.name}"` : `تم إضافة "${saved.name}"`);
      onClose();
    },
    onError: (e) => toast.error(e.message || "حصلت مشكلة أثناء حفظ الإضافة"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "تعديل إضافة" : "إضافة جديدة"}
      fullOnMobile
      size="md"
      footer={
        <div className="flex gap-3">
          <Button variant="ghost" block onClick={onClose} disabled={mutation.isPending}>
            إلغاء
          </Button>
          <Button type="submit" form="addon-form" block loading={mutation.isPending}>
            {isEdit ? "حفظ التعديلات" : "إضافة"}
          </Button>
        </div>
      }
    >
      <form id="addon-form" noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <Input
          label="اسم الإضافة"
          placeholder="مثال: سلطة خضرا"
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />

        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border-2 border-ink/10 bg-white px-4 py-2.5">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 cursor-pointer rounded accent-brand-red"
            {...register("isFree", {
              onChange: (e) => {
                clearErrors("price");
                if (e.target.checked) setValue("price", "0");
                else {
                  setValue("price", "");
                  setTimeout(() => setFocus("price"));
                }
              },
            })}
          />
          <span className="font-bold text-ink">مجاني</span>
          <span className="text-sm text-ink-soft">(السعر 0)</span>
        </label>

        <Input
          label="السعر (جنيه)"
          type="number"
          lang="en"
          inputMode="decimal"
          min="0"
          step="any"
          dir="ltr"
          placeholder="مثال: 10"
          disabled={isFree}
          error={errors.price?.message}
          hint={isFree ? "الإضافة مجانية — شيل علامة مجاني عشان تحط سعر" : undefined}
          className="text-end"
          {...register("price")}
        />

        {isEdit && (
          <p className="rounded-2xl bg-cream-dark p-3 text-sm text-ink-soft">
            التعديل مش هيغيّر الطلبات القديمة — كل طلب محتفظ بالاسم والسعر وقت ما اتعمل.
          </p>
        )}
      </form>
    </Modal>
  );
}
