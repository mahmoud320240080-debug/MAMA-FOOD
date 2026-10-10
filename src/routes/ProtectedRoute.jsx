import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";

// ⚠️ حماية شكلية للفرونت فقط. الباك لازم يتحقق من التوكن في كل request.
export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  return token ? <Outlet /> : <Navigate to="/admin/login" replace state={{ from: location }} />;
}
