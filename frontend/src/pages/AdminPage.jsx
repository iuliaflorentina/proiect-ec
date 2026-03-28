import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package, User, Calendar, DollarSign, Sparkles, Download } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminPage() {
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      navigate('/auth/login')
      return
    }

    const fetchOrders = async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${API}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 403) {
          setError('Access denied. Admin privileges required.')
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setOrders(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user, navigate, getToken])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center max-w-md">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">All orders placed on the platform</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">
                ${orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(orders.map((o) => o.userId)).size}
              </p>
              <p className="text-sm text-muted-foreground">Unique Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Order ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Customer</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Items</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Total</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">
                        {order.shipping?.firstName} {order.shipping?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{order.userEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex flex-col gap-1 border-b border-border/30 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                            <div className="flex items-center justify-between gap-4 text-xs">
                              <span className="font-medium text-foreground">{item.name} ×{item.quantity}</span>
                              <div className="flex items-center gap-2">
                                {item.customization && (
                                  <Link
                                    to="/customize"
                                    state={{
                                      productId: item.productId,
                                      customization: item.customization
                                    }}
                                    className="flex items-center gap-1 font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                    Design
                                  </Link>
                                )}
                                {item.modelUrl && (
                                  <a 
                                    href={item.modelUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <Download className="h-3 w-3" />
                                    GLB
                                  </a>
                                )}
                              </div>
                            </div>
                            {item.designId && (
                              <div className="text-[10px] text-muted-foreground/60 font-mono">
                                ID: {item.designId}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      ${parseFloat(order.total || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {order.createdAt
                          ? new Date(order.createdAt._seconds * 1000).toLocaleDateString()
                          : '—'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
