import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import CustomerLayout from "@/components/layout/CustomerLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import Home from "@/pages/customer/Home";
import NotFound from "@/pages/customer/NotFound";
import Skeleton from "@/components/common/Skeleton";

const Login = lazy(() => import("@/pages/admin/Login"));
const Orders = lazy(() => import("@/pages/admin/Orders"));
const Menu = lazy(() => import("@/pages/admin/Menu"));
const Meals = lazy(() => import("@/pages/admin/Meals"));
const Addons = lazy(() => import("@/pages/admin/Addons"));

const Fallback = () => <div className="space-y-3 p-6"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-40" /></div>;

export default function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          {/* المرحلة 1: /checkout و /order-success/:id */}
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<Orders />} />
            <Route path="menu" element={<Menu />} />
            <Route path="meals" element={<Meals />} />
            <Route path="addons" element={<Addons />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
