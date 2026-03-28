import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, ChevronRight, Lock, ArrowRight, Home, CreditCard, ShoppingBag } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'


const STEPS = ['Shipping', 'Payment', 'Confirm']
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function CheckoutPage() {
  const [step, setStep] = useState(0)
  const [placed, setPlaced] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card' or 'ramburs'
  const { items, subtotal, clearCart } = useCart()
  const { user, getToken } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: user?.email || '', address: '', city: '', zip: '', country: '',
  })

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handlePlace = async () => {
    if (!user) {
      navigate('/auth/login')
      return
    }
    setPlacingOrder(true)
    setOrderError('')
    try {
      const token = await getToken()
      const totalAmount = (subtotal + (subtotal > 150 ? 0 : 12.99)).toFixed(2)
      
      const shipping = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        method: 'home',
        address: form.address,
        city: form.city,
        zip: form.zip,
        country: form.country,
      }

      if (paymentMethod === 'card') {
        const res = await fetch(`${API}/api/payment/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items,
            shipping,
            total: totalAmount,
          }),
        })
        
        if (!res.ok) throw new Error('Failed to create checkout session')
        const { url } = await res.json()
        
        // Bridge customization data to success page via localStorage
        localStorage.setItem('pending_stripe_items', JSON.stringify(items));
        
        window.location.href = url
        return
      }

      // Handle Ramburs
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map(({ id, productId, name, price, quantity, customization, designId, modelUrl, metadataUrl }) => ({ 
            id, 
            productId, 
            name, 
            price, 
            quantity, 
            customization,
            designId,
            modelUrl,
            metadataUrl
          })),
          shipping,
          total: totalAmount,
          paymentMethod,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      clearCart()
      setPlaced(true)
    } catch (err) {
      setOrderError(err.message || 'Something went wrong, please try again.')
    } finally {
      setPlacingOrder(false)
    }
  }


  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign in to checkout</h1>
        <p className="mt-3 text-muted-foreground">You need an account to place an order.</p>
        <Link to="/auth/login" className="mt-8">
          <Button size="lg">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Order Placed!</h1>
        <p className="mt-3 text-muted-foreground">Thank you for your order. We'll start working on it shortly.</p>
        <Link to="/" className="mt-8">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    )
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">Checkout</h1>

      {/* Steps */}
      <div className="mb-10 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${i <= step ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`text-sm font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
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

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</label>
                  <input name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="123 Street Name" />
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
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(1)} 
                disabled={!form.firstName || !form.lastName || !form.email || !form.address || !form.city || !form.zip || !form.country}
              >
                Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Payment Method</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-border/80'}`}
                >
                  <CreditCard className="h-8 w-8" />
                  <span className="font-semibold">Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('ramburs')}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 p-6 transition-all ${paymentMethod === 'ramburs' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-muted-foreground hover:border-border/80'}`}
                >
                  <ShoppingBag className="h-8 w-8" />
                  <span className="font-semibold">Ramburs</span>
                </button>
              </div>

              {paymentMethod === 'card' && (
                <div className="rounded-lg bg-primary/5 p-4 text-sm text-foreground/80 border border-primary/20">
                  <p>You will be redirected to Stripe to securely complete your payment.</p>
                </div>
              )}


              {paymentMethod === 'ramburs' && (
                <div className="rounded-lg bg-primary/5 p-4 text-sm text-foreground/80 border border-primary/20">
                  <p>You will pay for the order in cash when it is delivered to your address. Please ensure you have the exact amount ready.</p>
                </div>
              )}

              <Button 
                className="w-full" 
                size="lg" 
                onClick={() => setStep(2)}
              >
                Review Order <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Review Your Order</h2>
              
              {orderError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                  {orderError}
                </div>
              )}

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {item.metadataUrl ? (
                         <img src={item.metadataUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Payment Method</span>
                   <span className="font-medium text-foreground uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-foreground pt-2 border-t border-border/50">
                  <span>Total (incl. ship)</span>
                  <span>${(subtotal + (subtotal > 150 ? 0 : 12.99)).toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handlePlace} disabled={placingOrder}>
                {placingOrder ? 'Processing...' : `Pay & Place Order`} <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="h-fit rounded-xl border border-border bg-card p-4 space-y-3 shadow-lg">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Order Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground font-medium">{subtotal > 150 ? 'FREE' : '$12.99'}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-base font-bold text-primary">
              <span>Total</span>
              <span>${(subtotal + (subtotal > 150 ? 0 : 12.99)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
