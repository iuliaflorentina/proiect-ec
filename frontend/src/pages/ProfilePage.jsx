import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, Calendar, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STATUS_STYLES = {
  pending:    'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  shipped:    'bg-purple-500/10 text-purple-500',
  delivered:  'bg-green-500/10 text-green-500',
  default:    'bg-primary/10 text-primary',
}

export default function ProfilePage() {
  const { user, logout, getToken } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/auth/login'); return }
    const fetchOrders = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API}/api/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) setOrders(await res.json())
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user, navigate, getToken])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user.displayName || 'My Account'}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">{orders.length}</p>
          <p className="text-sm text-muted-foreground">Total Orders</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-2xl font-bold text-foreground">
            ${orders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">Total Spent</p>
        </div>
        <div className="hidden rounded-xl border border-border bg-card p-5 sm:block">
          <p className="truncate text-lg font-bold text-foreground">
            {user.email}
          </p>
          <p className="text-sm text-muted-foreground">Email</p>
        </div>
      </div>

      {/* Order history */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Order History</h2>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-card py-16 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-foreground font-medium">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Looks like you haven't placed an order.</p>
            <Link to="/products" className="mt-6">
              <Button size="sm">Shop Now</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = order.status || 'pending'
              const statusCls = STATUS_STYLES[status] || STATUS_STYLES.default
              const date = order.createdAt
                ? new Date(order.createdAt._seconds * 1000).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })
                : '—'
              return (
                <div key={order.id} className="rounded-xl border border-border bg-card p-5">
                  {/* Order top row */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusCls}`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {date}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4 space-y-2 border-t border-border pt-4">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">
                          {item.name}
                          <span className="ml-1 text-muted-foreground">×{item.quantity}</span>
                        </span>
                        <span className="text-muted-foreground">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping */}
                  {order.shipping && (
                    <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                      Ships to: {order.shipping.address}, {order.shipping.city},{' '}
                      {order.shipping.zip} {order.shipping.country}
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-end text-sm font-semibold text-foreground">
                    Total: ${parseFloat(order.total || 0).toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
