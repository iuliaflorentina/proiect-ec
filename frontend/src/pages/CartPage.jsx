import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useState } from 'react'

export default function CartPage() {
    const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart()
    const [promoCode, setPromoCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [promoApplied, setPromoApplied] = useState(false)

    const shipping = subtotal > 150 ? 0 : 12.99
    const discountAmount = subtotal * discount
    const total = subtotal - discountAmount + shipping

    const applyPromo = () => {
        if (promoCode.toUpperCase() === 'BRUSHCRAFT10') {
            setDiscount(0.1)
            setPromoApplied(true)
        }
    }

    if (items.length === 0) {
        return (
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
                <p className="mt-2 text-muted-foreground">
                    Looks like you haven't added anything yet.
                </p>
                <Link to="/products" className="mt-6">
                    <Button size="lg">
                        Shop Collection
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Shopping Cart</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="flex gap-4 rounded-xl border border-border bg-card p-4"
                        >
                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="flex flex-1 flex-col">
                                <div className="flex justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                        {item.customization && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <Link 
                                                    to="/customize" 
                                                    state={{ 
                                                        productId: item.productId, 
                                                        customization: item.customization 
                                                    }}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded transition-colors"
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    Edit Design
                                                </Link>
                                                {item.modelUrl && (
                                                    <a 
                                                        href={item.modelUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded transition-colors"
                                                    >
                                                        <Download className="h-3 w-3" />
                                                        Download 3D
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2 rounded-lg border border-border">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-foreground">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <span className="font-semibold text-foreground">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="rounded-xl border border-border bg-card p-6 h-fit space-y-4">
                    <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-primary">
                                <span>Discount (10%)</span>
                                <span>-${discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Promo code */}
                    <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                            Promo Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="BRUSHCRAFT10"
                                disabled={promoApplied}
                                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={applyPromo}
                                disabled={promoApplied}
                            >
                                {promoApplied ? '✓' : 'Apply'}
                            </Button>
                        </div>
                        {promoApplied && (
                            <p className="mt-1 text-xs text-primary">10% discount applied!</p>
                        )}
                    </div>

                    <Link to="/checkout" className="block">
                        <Button className="w-full" size="lg">
                            Proceed to Checkout
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>

                    <Link
                        to="/products"
                        className="block text-center text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
