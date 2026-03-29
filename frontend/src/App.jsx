import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Lazy load pages for performance
const HomePage = lazy(() => import('@/pages/HomePage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const CartPage = lazy(() => import('@/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const GalleryPage = lazy(() => import('@/pages/GalleryPage'))
const ReviewsPage = lazy(() => import('@/pages/ReviewsPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'))
const CustomizerPage = lazy(() => import('@/pages/CustomizerPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route element={<Layout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/products" element={<ProductsPage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                                <Route path="/checkout/success" element={<OrderSuccessPage />} />
                                <Route path="/gallery" element={<GalleryPage />} />

                                <Route path="/reviews" element={<ReviewsPage />} />
                                <Route path="/auth/login" element={<LoginPage />} />
                                <Route path="/auth/signup" element={<SignupPage />} />
                                <Route path="/customize" element={<CustomizerPage />} />
                                <Route path="/admin" element={<AdminPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                            </Route>
                        </Routes>
                    </Suspense>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
