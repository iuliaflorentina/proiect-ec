import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'

const STEPS = ['Shipping', 'Payment', 'Confirm']

export default function CheckoutPage() {
    const [step, setStep] = useState(0)
    const [placed, setPlaced] = useState(false)
    const { items, subtotal, clearCart } = useCart()
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', address: '', city: '', zip: '', country: '',
        cardNumber: '', cardExpiry: '', cardCvv: '',
    })

    const handleChange = (e) =>
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

    const handlePlace = () => {
        clearCart()
        setPlaced(true)
    }

    if (placed) {
        return (
            <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Order Placed!</h1>
                <p className="mt-3 text-muted-foreground">
                    Thank you for your order. Our artists will start working on your
                    masterpiece. You'll receive an email confirmation shortly.
                </p>
                <Link to="/" className="mt-8">
                    <Button size="lg">Back to Home</Button>
                </Link>
            </div>
        )
    }

    const inputCls =
        'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
            <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

            {/* Steps */}
            <div className="mb-10 flex items-center gap-2">
                {STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-2">
                        <button
                            onClick={() => i < step && setStep(i)}
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${i <= step
                                    ? 'bg-primary text-primary-foreground'
                                    : 'border border-border text-muted-foreground'
                                }`}
                        >
                            {i < step ? '✓' : i + 1}
                        </button>
                        <span
                            className={`text-sm font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'
                                }`}
                        >
                            {s}
                        </span>
                        {i < STEPS.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-border mx-1" />
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Form */}
                <div className="lg:col-span-2">
                    {step === 0 && (
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Shipping Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">First Name</label>
                                    <input name="firstName" value={form.firstName} onChange={handleChange} className={inputCls} placeholder="John" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Last Name</label>
                                    <input name="lastName" value={form.lastName} onChange={handleChange} className={inputCls} placeholder="Doe" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                                <input name="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="john@example.com" type="email" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Address</label>
                                <input name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="123 Art Street" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">City</label>
                                    <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="New York" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">ZIP</label>
                                    <input name="zip" value={form.zip} onChange={handleChange} className={inputCls} placeholder="10001" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Country</label>
                                    <input name="country" value={form.country} onChange={handleChange} className={inputCls} placeholder="USA" />
                                </div>
                            </div>
                            <Button className="w-full" size="lg" onClick={() => setStep(1)}>
                                Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-muted-foreground">Card Number</label>
                                <input name="cardNumber" value={form.cardNumber} onChange={handleChange} className={inputCls} placeholder="4242 4242 4242 4242" maxLength={19} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Expiry Date</label>
                                    <input name="cardExpiry" value={form.cardExpiry} onChange={handleChange} className={inputCls} placeholder="MM/YY" maxLength={5} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">CVV</label>
                                    <input name="cardCvv" value={form.cardCvv} onChange={handleChange} className={inputCls} placeholder="123" maxLength={3} />
                                </div>
                            </div>
                            <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                                Review Order <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-foreground">Review Your Order</h2>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3">
                                        <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-border pt-3 flex justify-between font-semibold text-foreground">
                                <span>Total</span>
                                <span>${(subtotal + (subtotal > 150 ? 0 : 12.99)).toFixed(2)}</span>
                            </div>
                            <Button className="w-full" size="lg" onClick={handlePlace}>
                                Place Order <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mini-summary */}
                <div className="h-fit rounded-xl border border-border bg-card p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Your Items ({items.length})</h3>
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                            <span className="text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold text-foreground">
                        <span>Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
