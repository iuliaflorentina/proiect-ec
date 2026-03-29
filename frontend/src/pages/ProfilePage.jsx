import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Package, LogOut, Calendar, ShoppingBag, Home, Ticket, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ReviewModal } from '@/components/profile/ReviewModal'
import { StatusStepper } from '@/components/profile/StatusStepper'
import { InvoiceTemplate } from '@/components/profile/InvoiceTemplate'
import { useRef } from 'react'
import { FileText, Download } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const STATUS_STYLES = {
  received:   'bg-yellow-500/10 text-yellow-500',
  processing: 'bg-blue-500/10 text-blue-500',
  shipped:    'bg-purple-500/10 text-purple-500',
  delivered:  'bg-green-500/10 text-green-500',
  paid:       'bg-green-500/10 text-green-500',
  default:    'bg-primary/10 text-primary',
}

const STATUS_LABELS = {
  paid:       'Paid',
  received:   'Received',
  processing: 'In Progress',
  shipped:    'On its way',
  delivered:  'Done',
}

export default function ProfilePage() {
  const { user, logout, getToken } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    product: null,
    orderId: null
  })

  // Printing State
  const printRef = useRef()
  const [printingOrder, setPrintingOrder] = useState(null)

  const handlePrint = (order) => {
    setPrintingOrder(order)
    setTimeout(() => {
      window.print()
    }, 500)
  }

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

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API}/api/coupons/active`)
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!user) { navigate('/auth/login'); return }
    fetchOrders()
    fetchCoupons()
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground font-orbitron">
              {user.displayName || 'My Account'}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/20" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-foreground font-orbitron">{orders.length}</p>
          <p className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Total Orders</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-2xl font-bold text-foreground font-orbitron">
            ${orders.reduce((s, o) => s + parseFloat(o.total || 0), 0).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground uppercase tracking-wider text-[10px] font-bold">Total Spent</p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm hover:border-primary/50 transition-colors">
          <p className="text-2xl font-bold text-primary font-orbitron">{coupons.length}</p>
          <p className="text-sm text-primary uppercase tracking-wider text-[10px] font-bold">Active Rewards</p>
        </div>
      </div>

      {/* Coupons Section */}
      {coupons.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground font-orbitron">My Rewards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map(coupon => (
              <div key={coupon.id} className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg group">
                <div className="absolute -right-4 -top-4 h-16 w-16 rotate-12 bg-primary/10 opacity-20 group-hover:scale-125 transition-transform" />
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground font-orbitron tracking-tight decoration-primary/30 underline-offset-4 decoration-2">{coupon.code}</h3>
                    <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">
                       {coupon.type === 'percent' ? `${coupon.value}% DISCOUNT` : `$${coupon.value} DISCOUNT`}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="text-[10px] space-y-1">
                    <p className="text-muted-foreground uppercase font-bold tracking-tighter opacity-70">Min Order: ${coupon.minAmount || 0}</p>
                    {coupon.expiresAt && (function() {
                       const dateObj = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)
                       if (isNaN(dateObj.getTime())) return null
                       return (
                         <p className="text-muted-foreground uppercase font-bold tracking-tighter opacity-70">
                           Expires: {dateObj.toLocaleDateString()}
                         </p>
                       )
                    })()}
                  </div>
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="h-auto p-0 text-[10px] font-bold uppercase text-primary hover:no-underline"
                    onClick={() => {
                       navigator.clipboard.writeText(coupon.code)
                       alert('Coupon code copied to clipboard!')
                    }}
                  >
                    Copy Code
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders section */}
      <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2 font-orbitron">
        <Package className="h-5 w-5 text-primary" />
        Order History
      </h2>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Link to="/products" className="mt-6 inline-block">
            <Button variant="outline">Start Customizing</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/20 transition-all">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-4">
                <div className="space-y-1">
                   <p className="text-sm font-semibold text-foreground uppercase tracking-tight">Order #{order.id.slice(-8)}</p>
                   <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                   </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLES[order.status] || STATUS_STYLES.default}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <p className="text-lg font-bold text-foreground font-orbitron">${parseFloat(order.total || 0).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                  {order.receiptUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 text-[10px] font-bold uppercase border-primary/20 hover:bg-primary/5 transition-colors flex-1 sm:flex-none"
                      onClick={() => window.open(order.receiptUrl, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                      Receipt
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-[10px] font-bold uppercase border-border hover:bg-secondary/50 flex-1 sm:flex-none"
                    onClick={() => handlePrint(order)}
                  >
                    <FileText className="h-3 w-3" />
                    Invoice
                  </Button>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="mb-8">
                 <StatusStepper currentStatus={order.status} />
              </div>

              <div className="space-y-4">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 rounded-lg bg-secondary/5 p-3 border border-border/30">
                    <div className="flex items-center gap-3">
                       <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center border border-border overflow-hidden">
                          {item.metadataUrl || item.image ? (
                             <img src={item.metadataUrl || item.image} className="h-full w-full object-cover" />
                          ) : (
                             <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          )}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-foreground uppercase tracking-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       {order.status === 'delivered' && (
                         <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-[10px] font-bold uppercase p-0 h-auto text-primary hover:text-primary/80"
                            onClick={() => setReviewModal({ isOpen: true, product: item, orderId: order.id })}
                         >
                            Add Review
                         </Button>
                       )}
                       <p className="text-sm font-bold text-foreground font-orbitron">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-6 space-y-2 border-t border-border/50 pt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {order.subtotal && (
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-foreground">${parseFloat(order.subtotal).toFixed(2)}</span>
                    </div>
                  )}
                  {parseFloat(order.discount || 0) > 0 && (
                    <div className="flex justify-between text-green-500 italic">
                      <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                      <span>-${parseFloat(order.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-foreground">{parseFloat(order.shippingCost || 0) === 0 ? 'FREE' : `$${parseFloat(order.shippingCost).toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-2 text-sm text-primary font-orbitron">
                    <span>Grand Total</span>
                    <span>${parseFloat(order.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
          product={reviewModal.product}
          orderId={reviewModal.orderId}
        />
      )}
      {/* Hidden Print Area */}
      <div className="hidden print:block print-area fixed inset-0 z-[9999] bg-white">
         <InvoiceTemplate ref={printRef} order={printingOrder} />
      </div>
    </div>
  )
}
