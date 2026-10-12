import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import CustomerLayout from "@/components/layout/CustomerLayout";
import ProtectedRoute from "./ProtectedRoute";
import Home from "@/pages/customer/Home";
import PageLoader from "@/components/common/PageLoader";
import {
  AdminLayout, Addons, Checkout, Dashboard, Login, Meals, Menu, NotFound, OrderDetails, OrderSuccess, Orders, Payment, Settings,
} from "./pages";

export default function AppRoutes() {
  return (
    // لودر الشاشة كلها: لصفحة الدخول ولوحة التحكم أول مرة (صفحات الزبون ليها Suspense جوه الـ layout)
    <Suspense fallback={<PageLoader className="min-h-dvh bg-cream" />}>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<Menu />} />
            <Route path="meals" element={<Meals />} />
            <Route path="addons" element={<Addons />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="settings" element={<Settings />} />
            {/* مسار أدمن غلط => 404 جوه لوحة التحكم (بزرار يرجع للداشبورد) */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
