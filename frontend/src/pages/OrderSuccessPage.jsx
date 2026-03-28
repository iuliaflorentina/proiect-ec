import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Loader2, ShoppingBag, XCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const { getToken, user } = useAuth()
  const { clearCart } = useCart()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [orderId, setOrderId] = useState(null)
  const confirming = useRef(false)

  useEffect(() => {
    if (!sessionId || !user || confirming.current) return

    const confirmOrder = async () => {
      confirming.current = true
      try {
        const token = await getToken()
        
        // Retrieve full items (with customization) from localStorage
        const storedItems = localStorage.getItem('pending_stripe_items');
        const items = storedItems ? JSON.parse(storedItems) : null;
        
        const res = await fetch(`${API}/api/orders/confirm-stripe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            sessionId,
            items // Send full items if available
          }),
        })

        if (!res.ok) throw new Error('Failed to confirm order')
        const data = await res.json()
        setOrderId(data.id)
        setStatus('success')
        
        // Success! Clean up storage
        localStorage.removeItem('pending_stripe_items');
        clearCart()
      } catch (err) {
        console.error(err)
        setStatus('error')
      }
    }

    confirmOrder()
  }, [sessionId, user, getToken, clearCart])

  if (status === 'loading') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Confirming Payment...</h1>
        <p className="mt-3 text-muted-foreground">Please wait while we verify your order details.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Payment Verification Failed</h1>
        <p className="mt-3 text-muted-foreground">We couldn't verify your payment. If you've been charged, please contact support.</p>
        <Link to="/checkout" className="mt-8">
          <Button size="lg" variant="outline">Try Again</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 text-center lg:px-8">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Successful!</h1>
      <p className="mt-3 text-lg text-muted-foreground">Thank you for your order. We've received your payment and started working on your custom piece.</p>
      
      {orderId && (
        <div className="mt-6 rounded-lg bg-card border border-border p-4 w-full">
           <p className="text-sm text-muted-foreground mb-1">Order ID</p>
           <p className="font-mono font-bold text-foreground break-all">{orderId}</p>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-3 w-full sm:flex-row sm:justify-center">
        <Link to="/profile">
          <Button size="lg" className="w-full sm:w-auto">View My Orders</Button>
        </Link>
        <Link to="/">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  )
}
