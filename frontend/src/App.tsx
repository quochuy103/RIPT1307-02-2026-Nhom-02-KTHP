import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartSidebar from "@/components/CartSidebar";
import Index from "./pages/Index";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import ShopPage from "./pages/ShopPage";
import CheckoutPage from "./pages/CheckoutPage";
import GalleryPage from "./pages/GalleryPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminServices from "./pages/admin/AdminServices";
import AdminBarbers from "./pages/admin/AdminBarbers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId || 'not-configured'}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Admin routes -- own layout, no Navbar/Footer */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="bookings" element={<AdminBookings />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="barbers" element={<AdminBarbers />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="gallery" element={<AdminGallery />} />
                  <Route path="reviews" element={<AdminReviews />} />
                  <Route path="settings" element={<AdminSettings />} />
                </Route>

                {/* Public routes */}
                <Route path="*" element={
                  <>
                    <Navbar />
                    <CartSidebar />
                    <main className="min-h-screen">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/booking" element={<BookingPage />} />
                        <Route path="/shop" element={<ShopPage />} />
                        <Route path="/checkout" element={<CheckoutPage />} />
                        <Route path="/gallery" element={<GalleryPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </>
                } />
              </Routes>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;