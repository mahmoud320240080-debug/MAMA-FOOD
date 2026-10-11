import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminStore } from "@/store/useAdminStore";

/**
 * حماية مسارات الأدمن — التحقق من وجود adminToken
 */
export default function ProtectedRoute({ children }) {
  const adminToken = useAdminStore((s) => s.adminToken);
  const location = useLocation();

  if (!adminToken) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
}
