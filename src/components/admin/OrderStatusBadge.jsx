import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { ORDER_STATUS } from "@/lib/constants";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";

/** بادج حالة الطلب — بيعمل pop لما الحالة تتغير (مش في أول ظهور) */
export default function OrderStatusBadge({ status, className }) {
  const info = ORDER_STATUS[status] || { label: status, badge: "bg-ink/10 text-ink" };
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  return (
    <m.span
      key={status}
      initial={mounted.current ? { opacity: 0, scale: 0.7 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.pop}
      className={cn("inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold", info.badge, className)}
    >
      {info.label}
    </m.span>
  );
}
