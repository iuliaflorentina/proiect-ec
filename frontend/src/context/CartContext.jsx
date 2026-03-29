import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => {
        const saved = localStorage.getItem('cart')
        return saved ? JSON.parse(saved) : []
    })
    const [appliedCoupon, setAppliedCoupon] = useState(null)

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    const addItem = (product, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === product.id)
            if (existing) {
                return prev.map((i) =>
                    i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
                )
            }
            return [...prev, { ...product, quantity }]
        })
    }

    const removeItem = (id) => {
        setItems((prev) => prev.filter((i) => i.id !== id))
    }

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) {
            removeItem(id)
            return
        }
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
    }

    const clearCart = () => {
        setItems([])
        setAppliedCoupon(null)
    }

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return (
        <CartContext.Provider
            value={{ items, addItem, removeItem, updateQuantity, clearCart, subtotal, appliedCoupon, setAppliedCoupon }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used within CartProvider')
    return ctx
}
