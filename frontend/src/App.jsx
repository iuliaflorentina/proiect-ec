import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import GalleryPage from '@/pages/GalleryPage'
import ReviewsPage from '@/pages/ReviewsPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import CustomizerPage from '@/pages/CustomizerPage'
import AdminPage from '@/pages/AdminPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CartProvider>
                    <Routes>
                        <Route element={<Layout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/gallery" element={<GalleryPage />} />
                            <Route path="/reviews" element={<ReviewsPage />} />
                            <Route path="/auth/login" element={<LoginPage />} />
                            <Route path="/auth/signup" element={<SignupPage />} />
                            <Route path="/customize" element={<CustomizerPage />} />
                            <Route path="/admin" element={<AdminPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                        </Route>
                    </Routes>
                </CartProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
