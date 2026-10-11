import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api";

/** إحصائيات لوحة التحكم — بتتجاب من جديد كل ما الصفحة تتفتح، وكل 30 ثانية زي صفحة الطلبات */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.getStats,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });
}
