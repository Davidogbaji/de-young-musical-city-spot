import { Outlet, ScrollRestoration } from "react-router-dom";
import CartDrawer from "../components/CartDrawer";
import Footer from "../components/Footer";
import Header from "../components/Header";
import WhatsAppWidget from "../components/WhatsAppWidget";

export default function MainLayout() {
  return (
    <>
      <Header />
      <main><Outlet /></main>
      <Footer />
      <CartDrawer />
      <WhatsAppWidget />
      <ScrollRestoration />
    </>
  );
}
