import { lazy } from "react";

/**
 * الصفحات اللي بتتحمّل lazy (كل صفحة chunk لوحدها). الرئيسية مش هنا: هي أول حاجة الزبون بيشوفها.
 * مكتبات الأدمن التقيلة (recharts، dnd-kit) بتيجي مع صفحاتها بس.
 */
export const loadCheckout = () => import("@/pages/customer/Checkout");

export const Checkout = lazy(loadCheckout);
export const OrderSuccess = lazy(() => import("@/pages/customer/OrderSuccess"));
export const NotFound = lazy(() => import("@/pages/customer/NotFound"));

export const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
export const Login = lazy(() => import("@/pages/admin/Login"));
export const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
export const Orders = lazy(() => import("@/pages/admin/Orders"));
export const OrderDetails = lazy(() => import("@/pages/admin/OrderDetails"));
export const Menu = lazy(() => import("@/pages/admin/Menu"));
export const Meals = lazy(() => import("@/pages/admin/Meals"));
export const Addons = lazy(() => import("@/pages/admin/Addons"));
export const Settings = lazy(() => import("@/pages/admin/Settings"));
