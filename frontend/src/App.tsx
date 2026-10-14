import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";

const Shop = lazy(() => import("./pages/Shop"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderPage = lazy(() => import("./pages/OrderPage"));
const Account = lazy(() => import("./pages/Account"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AuthPages = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.Login })));
const RegisterPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.Register })));
const ForgotPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.ForgotPassword })));
const ResetPage = lazy(() => import("./pages/AuthPages").then((m) => ({ default: m.ResetPassword })));
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const RequireAdmin = lazy(() => import("./admin/AdminLayout").then((m) => ({ default: m.RequireAdmin })));
const AdminDashboard = lazy(() => import("./admin/Dashboard"));
const AdminProducts = lazy(() => import("./admin/Products"));
const AdminOrders = lazy(() => import("./admin/Orders"));
const AdminCatalog = lazy(() => import("./admin/Catalog"));
const AdminDelivery = lazy(() => import("./admin/Delivery"));
const StudioSetup = lazy(() => import("./pages/StudioSetup"));
const About = lazy(() => import("./pages/InfoPages").then((m) => ({ default: m.About })));
const Contact = lazy(() => import("./pages/InfoPages").then((m) => ({ default: m.Contact })));
const Unsubscribe = lazy(() => import("./pages/InfoPages").then((m) => ({ default: m.Unsubscribe })));
const Policy = lazy(() => import("./pages/InfoPages").then((m) => ({ default: m.Policy })));
const AdminEnquiries = lazy(() => import("./admin/Enquiries"));
const AdminContent = lazy(() => import("./admin/Content"));
const AdminSettings = lazy(() => import("./admin/Settings"));
const AdminSubscribers = lazy(() => import("./admin/Subscribers"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const wrap = (el: JSX.Element) => <Suspense fallback={<p className="p-10 text-center">Loading…</p>}>{el}</Suspense>;
const soon = (title: string, stage: number) => (
  <Suspense fallback={<p className="p-10 text-center">Loading…</p>}><ComingSoon title={title} stage={stage} /></Suspense>
);

const router = createBrowserRouter([
  {
    path: "/admin",
    element: wrap(<RequireAdmin><AdminLayout /></RequireAdmin>),
    children: [
      { index: true, element: wrap(<AdminDashboard />) },
      { path: "products", element: wrap(<AdminProducts />) },
      { path: "orders", element: wrap(<AdminOrders />) },
      { path: "catalog", element: wrap(<AdminCatalog />) },
      { path: "delivery", element: wrap(<AdminDelivery />) },
      { path: "enquiries", element: wrap(<AdminEnquiries />) },
      { path: "content", element: wrap(<AdminContent />) },
      { path: "settings", element: wrap(<AdminSettings />) },
      { path: "subscribers", element: wrap(<AdminSubscribers />) },
    ],
  },
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/shop", element: wrap(<Shop />) },
      { path: "/product/:slug", element: wrap(<ProductPage />) },
      { path: "/checkout", element: wrap(<Checkout />) },
      { path: "/order/:reference", element: wrap(<OrderPage />) },
      { path: "/account", element: wrap(<RequireAuth><Account /></RequireAuth>) },
      { path: "/wishlist", element: wrap(<RequireAuth><Wishlist /></RequireAuth>) },
      { path: "/login", element: wrap(<AuthPages />) },
      { path: "/register", element: wrap(<RegisterPage />) },
      { path: "/forgot-password", element: wrap(<ForgotPage />) },
      { path: "/reset-password", element: wrap(<ResetPage />) },
      { path: "/studio-setup", element: wrap(<StudioSetup />) },
      { path: "/about", element: wrap(<About />) },
      { path: "/contact", element: wrap(<Contact />) },
      { path: "/delivery-returns", element: wrap(<Policy title="Delivery and returns" settingKey="policy_delivery" />) },
      { path: "/privacy", element: wrap(<Policy title="Privacy policy" settingKey="policy_privacy" />) },
      { path: "/terms", element: wrap(<Policy title="Terms and conditions" settingKey="policy_terms" />) },
      { path: "/unsubscribe", element: wrap(<Unsubscribe />) },
      { path: "*", element: soon("Page not found", 2) },
    ],
  },
]);

export default function App() {
  return <SettingsProvider><AuthProvider><WishlistProvider><CartProvider><RouterProvider router={router} /></CartProvider></WishlistProvider></AuthProvider></SettingsProvider>;
}
