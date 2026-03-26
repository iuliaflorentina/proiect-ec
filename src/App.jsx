import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from '@/context/CartContext'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import HomePage from '@/pages/HomePage'
import ProductsPage from '@/pages/ProductsPage'
import CartPage from '@/pages/CartPage'
import CheckoutPage from '@/pages/CheckoutPage'
import GalleryPage from '@/pages/GalleryPage'
import ReviewsPage from '@/pages/ReviewsPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import CustomizerPage from '@/pages/CustomizerPage'

export default function App() {
    return (
        <BrowserRouter>
            <CartProvider>
                <div className="flex min-h-screen flex-col bg-background">
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/gallery" element={<GalleryPage />} />
                            <Route path="/reviews" element={<ReviewsPage />} />
                            <Route path="/auth/login" element={<LoginPage />} />
                            <Route path="/auth/signup" element={<SignupPage />} />
                            <Route path="/customize" element={<CustomizerPage />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </CartProvider>
        </BrowserRouter>
    )
}
