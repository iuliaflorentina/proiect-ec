import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package, User, Calendar, DollarSign, Sparkles, Download, Database, Loader2, Image as ImageIcon, Trash2, Edit, Plus, Palette, Home, Star, ShoppingCart, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { GalleryItemModal } from '@/components/admin/GalleryItemModal'

import { gallerySeedData, productSeedData } from '@/lib/seeds'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function AdminPage() {
  const { user, getToken } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [gallery, setGallery] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')
  const [error, setError] = useState('')
  const [isSeeding, setIsSeeding] = useState(false)
  const [isSeedingGallery, setIsSeedingGallery] = useState(false)
  const [selectedGalleryItem, setSelectedGalleryItem] = useState(null)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [newCoupon, setNewCoupon] = useState({ code: '', type: 'percent', value: '', minAmount: '', expiresAt: '' })
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false)

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const { addItem } = useCart()
  const [added, setAdded] = useState({})

  const handleAdd = (product) => {
    addItem(product)
    setAdded((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1500)
  }

  const seedGallery = async () => {
    setIsSeedingGallery(true)
    setError('')
    try {
      const token = await getToken()
      for (const item of gallerySeedData) {
        await fetch(`${API}/api/gallery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        })
      }
      alert('Gallery seeded successfully!')
      fetchGallery()
    } catch (err) {
      setError('Failed to seed gallery: ' + err.message)
    } finally {
      setIsSeedingGallery(false)
    }
  }

  const seedBaseModels = async () => {
    setIsSeeding(true)
    setError('')
    try {
      const token = await getToken()
      for (const model of productSeedData) {
        await fetch(`${API}/api/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(model)
        })
      }
      alert('Base models restored! Check the Shop page.')
    } catch (err) {
      setError('Failed to seed models: ' + err.message)
    } finally {
      setIsSeeding(false)
    }
  }

  useEffect(() => {
    if (!user) {
      navigate('/auth/login')
      return
    }

    const fetchAdminData = async () => {
      try {
        const token = await getToken()
        
        // Fetch Orders
        const ordersRes = await fetch(`${API}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (ordersRes.status === 403) {
          setError('Access denied. Admin privileges required.')
          setLoading(false)
          return
        }
        if (!ordersRes.ok) throw new Error('Failed to fetch orders')
        const ordersData = await ordersRes.json()
        setOrders(ordersData)

        // Fetch Gallery
        await fetchGallery()

        // Fetch Products for fallbacks
        const productsRes = await fetch(`${API}/api/products`)
        if (productsRes.ok) setProducts(await productsRes.json())

        // Fetch Coupons
        const couponsRes = await fetch(`${API}/api/admin/coupons`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (couponsRes.ok) setCoupons(await couponsRes.json())
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [user, navigate, getToken])

  const fetchGallery = async () => {
    try {
      const res = await fetch(`${API}/api/gallery`)
      if (res.ok) {
        const data = await res.json()
        setGallery(data)
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err)
    }
  }

  const handleDeleteGalleryItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this artwork?')) return
    
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setGallery(prev => prev.filter(item => item.id !== id))
      } else {
        throw new Error('Failed to delete item')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return
    
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        alert('Product deleted successfully')
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleCreateCoupon = async (e) => {
    e.preventDefault()
    setIsCreatingCoupon(true)
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      })
      if (res.ok) {
        const created = await res.json()
        setCoupons(prev => [created, ...prev])
        setNewCoupon({ code: '', type: 'percent', value: '', minAmount: '', expiresAt: '' })
        alert('Coupon created successfully!')
      } else {
        throw new Error('Failed to create coupon')
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setIsCreatingCoupon(false)
    }
  }

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = await getToken()
      const res = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      } else {
        throw new Error('Failed to update status')
      }
    } catch (err) {
      alert(err.message)
    }
  }

  // Derived filtered data
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        order.id.toLowerCase().includes(searchLower) ||
        order.userEmail?.toLowerCase().includes(searchLower) ||
        `${order.shipping?.firstName} ${order.shipping?.lastName}`.toLowerCase().includes(searchLower)
      
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

      let matchesDate = true
      if (dateFilter && order.createdAt) {
        const orderDate = (function() {
          const s = order.createdAt._seconds ?? order.createdAt.seconds
          if (s !== undefined) return new Date(s * 1000)
          return new Date(order.createdAt)
        })()
        // Format YYYY-MM-DD for comparison
        const formattedOrderDate = orderDate.toISOString().split('T')[0]
        matchesDate = formattedOrderDate === dateFilter
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }, [orders, searchTerm, statusFilter, dateFilter])

  const mostOrderedProduct = useMemo(() => {
    if (!orders || orders.length === 0) return 'None'
    const counts = {}
    orders.forEach(order => {
      (order.items || []).forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity
      })
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    return sorted[0] ? sorted[0][0] : 'None'
  }, [orders])

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
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your business operations</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={seedGallery} 
            disabled={isSeedingGallery}
            className="gap-2"
          >
            {isSeedingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Restore Base Gallery
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={seedBaseModels} 
            disabled={isSeeding}
            className="gap-2"
          >
            {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Restore Base Models
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </span>
            <div className="overflow-hidden">
              <p className="text-xl font-bold text-foreground truncate">{mostOrderedProduct}</p>
              <p className="text-sm text-muted-foreground">Top Product</p>
            </div>
          </div>
        </div>
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

      {/* Tabs Navigation */}
      <div className="mb-6 flex border-b border-border">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'orders' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Orders Management
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'gallery' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Gallery Management
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'products' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-3 text-sm font-medium transition-all ${activeTab === 'coupons' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Promotions & Coupons
        </button>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 border border-border rounded-xl">
             <div className="relative flex-1 max-w-2xl">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Search by email, name or Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
             </div>
             <div className="flex flex-wrap gap-2">
                <input 
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
                />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="received">Received</option>
                  <option value="processing">In Progress</option>
                  <option value="shipped">On its way</option>
                  <option value="delivered">Done</option>
                </select>
                {(searchTerm || statusFilter !== 'all' || dateFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter(''); }}>
                    Clear
                  </Button>
                )}
             </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No orders found matching your criteria.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Order ID</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Customer</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Shipping</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Items</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Total</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredOrders.map((order) => (
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                              <Home className="h-3 w-3 text-primary" /> Home
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {order.shipping?.address}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 outline-none">
                          <div className="space-y-4">
                             {(order.items || []).map((item, i) => (
                              <div key={i} className="flex items-start gap-4 border-b border-border/30 last:border-0 pb-3 mb-3 last:pb-0 last:mb-0">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="font-bold text-foreground text-sm uppercase tracking-tight">{item.name} ×{item.quantity}</span>
                                    <div className="flex items-center gap-2">
                                      {item.customization ? (
                                        <Link
                                          to="/customize"
                                          state={{
                                            productId: item.productId,
                                            productPayload: { 
                                              ...(products.find(p => p.id === item.productId) || item), 
                                              type: (item.type || (item.customization?.decals3D?.length > 0 ? '3d' : '2d'))
                                            },
                                            customization: item.customization,
                                            readOnly: true
                                          }}
                                          className="flex items-center gap-1 font-bold text-primary hover:underline hover:text-primary/80 transition-colors bg-primary/5 px-2 py-1 rounded text-[10px]"
                                        >
                                          <Sparkles className="h-3 w-3" />
                                          SEE DESIGN
                                        </Link>
                                      ) : (
                                        <a 
                                          href={item.metadataUrl || item.image || products.find(p => p.name === item.name)?.image || `/products`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 font-bold text-primary hover:underline hover:text-primary/80 transition-colors bg-primary/5 px-2 py-1 rounded text-[10px]"
                                        >
                                          <ImageIcon className="h-3 w-3" />
                                          SEE DESIGN
                                        </a>
                                      )}
                                      {item.modelUrl && (
                                        <a 
                                          href={item.modelUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/20 px-2 py-1 rounded text-[10px]"
                                        >
                                          <Download className="h-3 w-3" />
                                          GLB
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 items-center">
                                    <span className="text-xs font-semibold text-muted-foreground">${(item.price || 0).toFixed(2)} / unit</span>
                                    {item.designId && (
                                      <span className="text-[10px] text-muted-foreground/60 font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                                        ID: {item.designId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground font-orbitron">${parseFloat(order.total || 0).toFixed(2)}</span>
                            {(parseFloat(order.discount || 0) > 0 || order.subtotal) && (
                              <div className="text-[9px] font-bold uppercase tracking-tight text-muted-foreground/60 flex flex-col italic">
                                {order.subtotal && <span>Sub: ${parseFloat(order.subtotal).toFixed(2)}</span>}
                                {parseFloat(order.discount || 0) > 0 && (
                                  <span className="text-green-500/70 truncate max-w-[100px]">
                                    -{parseFloat(order.discount).toFixed(2)} {order.couponCode ? `(${order.id.slice(-4)})` : ''}
                                  </span>
                                )}
                                {order.shippingCost !== undefined && (
                                  <span>Ship: {parseFloat(order.shippingCost) === 0 ? 'FREE' : `$${parseFloat(order.shippingCost).toFixed(2)}`}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            className={`rounded-lg border border-border bg-background px-2 py-1 text-xs font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none
                              ${order.status === 'delivered' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 
                                order.status === 'shipped' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' :
                                order.status === 'processing' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' :
                                order.status === 'received' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' :
                                order.status === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                                'text-primary'}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="received">Received</option>
                            <option value="processing">In Progress</option>
                            <option value="shipped">On its way</option>
                            <option value="delivered">Done</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <Calendar className="h-3.5 w-3.5" />
                            {(function() {
                              if (!order.createdAt) return '—'
                              const s = order.createdAt._seconds ?? order.createdAt.seconds
                              if (s !== undefined) return new Date(s * 1000).toLocaleDateString()
                              const d = new Date(order.createdAt)
                              return isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
                            })()}
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
      ) : activeTab === 'coupons' ? (
        <div className="space-y-8">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                 <div className="rounded-xl border border-border bg-card p-6 shadow-sm sticky top-24">
                    <h3 className="text-lg font-bold text-foreground mb-4 font-orbitron">Create New Coupon</h3>
                    <form onSubmit={handleCreateCoupon} className="space-y-4">
                       <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground font-orbitron">Code</label>
                          <input required type="text" placeholder="SUMMER20" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground font-orbitron">Type</label>
                             <select className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={newCoupon.type} onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}>
                                <option value="percent">Percent (%)</option>
                                <option value="fixed">Fixed ($)</option>
                             </select>
                          </div>
                          <div>
                             <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground font-orbitron">Value</label>
                             <input required type="number" placeholder="20" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={newCoupon.value} onChange={(e) => setNewCoupon({...newCoupon, value: e.target.value})} />
                          </div>
                       </div>
                       <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground font-orbitron">Min. Order ($)</label>
                          <input type="number" placeholder="0" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={newCoupon.minAmount} onChange={(e) => setNewCoupon({...newCoupon, minAmount: e.target.value})} />
                       </div>
                       <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground font-orbitron">Expiry Date</label>
                          <input type="date" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={newCoupon.expiresAt} onChange={(e) => setNewCoupon({...newCoupon, expiresAt: e.target.value})} />
                       </div>
                       <Button type="submit" className="w-full gap-2" disabled={isCreatingCoupon}>
                          {isCreatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Generate Coupon
                       </Button>
                    </form>
                 </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                 <h3 className="text-lg font-bold text-foreground font-orbitron">Existing Campaigns</h3>
                 {coupons.length === 0 ? (
                   <div className="rounded-xl border border-border bg-card p-12 text-center opacity-50">
                      <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p>No active promotional codes found.</p>
                   </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {coupons.map(coupon => (
                         <div key={coupon.id} className="rounded-xl border border-border bg-card p-5 shadow-sm group hover:border-primary/50 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                               <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                  <Ticket className="h-5 w-5 text-primary" />
                               </div>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteCoupon(coupon.id)}>
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                            <div className="space-y-1">
                               <h4 className="text-lg font-bold text-foreground tracking-tight font-orbitron">{coupon.code}</h4>
                               <p className="text-xs font-black text-primary uppercase">{coupon.type === 'percent' ? `${coupon.value}% Off` : `$${coupon.value} Off`}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/50 space-y-2 text-[10px] font-bold uppercase text-muted-foreground font-inter">
                               <div className="flex justify-between">
                                  <span>Min:</span> <span className="text-foreground">${coupon.minAmount || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Status:</span> <span className={`${coupon.active ? 'text-green-500' : 'text-destructive'}`}>{coupon.active ? 'Active' : 'Expired'}</span>
                                </div>
                                {coupon.expiresAt && (function() {
                                   const dateObj = coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt)
                                   if (isNaN(dateObj.getTime())) return null
                                   return (
                                     <div className="flex justify-between">
                                       <span>Expires:</span> <span className="text-foreground">{dateObj.toLocaleDateString()}</span>
                                     </div>
                                   )
                                })()}
                            </div>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>
        </div>
      ) : activeTab === 'gallery' ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Artworks in Gallery ({gallery.length})</h2>
            <Button 
                onClick={() => { setSelectedGalleryItem(null); setIsGalleryModalOpen(true); }}
                className="gap-2"
            >
                <Plus className="h-4 w-4" />
                Add Artwork
            </Button>
          </div>
          {/* ... existing gallery table logic ... */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-border bg-muted/40">
                     <th className="px-6 py-4 text-left font-semibold text-foreground">Artwork</th>
                     <th className="px-6 py-4 text-left font-semibold text-foreground">Category</th>
                     <th className="px-6 py-4 text-left font-semibold text-foreground">Featured</th>
                     <th className="px-6 py-4 text-right font-semibold text-foreground">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {gallery.map((item) => (
                     <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-4">
                           <img src={item.image} alt={item.title} className="h-12 w-12 rounded-lg object-cover border border-border" />
                           <div className="font-bold text-foreground">{item.title}</div>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="capitalize px-2 py-1 rounded-full bg-secondary/30 text-[10px] font-bold border border-border">
                           {item.category}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         {item.featured ? (
                           <span className="flex items-center gap-1 text-primary font-bold text-xs uppercase tracking-widest">
                             <Sparkles className="h-3 w-3" />
                             Yes
                           </span>
                         ) : (
                           <span className="text-muted-foreground text-xs uppercase tracking-widest">No</span>
                         )}
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                           <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => { setSelectedGalleryItem(item); setIsGalleryModalOpen(true); }}
                               className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                           >
                             <Edit className="h-4 w-4" />
                           </Button>
                           <Button 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => handleDeleteGalleryItem(item.id)}
                               className="h-8 w-8 text-destructive hover:bg-destructive/10"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        </>
      ) : (
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-xl font-bold text-foreground">Product Inventory ({products.length})</h2>
                 <p className="text-sm text-muted-foreground">Manage base models and shop products</p>
              </div>
              <Button onClick={() => navigate('/products')} className="gap-2">
                 <Plus className="h-4 w-4" />
                 Add Product
              </Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-all">
                   <div className="aspect-video relative overflow-hidden bg-muted">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground border-border">{product.category}</Badge>
                        {product.type === '3d' && <Badge className="bg-primary/80 backdrop-blur-sm text-primary-foreground border-none">3D</Badge>}
                      </div>
                   </div>
                   <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-foreground truncate flex-1 mr-2">{product.name}</h3>
                         <span className="text-lg font-bold text-primary">${product.price}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                         <span>{product.customizable ? 'Customizable' : 'Fixed'}</span>
                      </div>
                      <div className="flex gap-2">
                         <Button 
                            variant="outline" 
                            className="flex-1 gap-2"
                            onClick={() => navigate('/products', { state: { productToEdit: product } })}
                         >
                            <Edit className="h-4 w-4" />
                            Edit
                         </Button>
                         <Button
                            size="icon"
                            onClick={() => handleAdd(product)}
                            className={`h-9 w-9 transition-all border border-transparent ${added[product.id] ? 'bg-green-600 hover:bg-green-600 text-white' : 'bg-primary text-primary-foreground'}
                                `}
                         >
                            {added[product.id] ? '✓' : <ShoppingCart className="h-4 w-4" />}
                         </Button>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 border border-destructive/20"
                            onClick={() => handleDeleteProduct(product.id)}
                         >
                            <Trash2 className="h-4 w-4" />
                         </Button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryModalOpen && (
        <GalleryItemModal
          isOpen={isGalleryModalOpen}
          onClose={() => setIsGalleryModalOpen(false)}
          item={selectedGalleryItem}
          onSaveSuccess={fetchGallery}
        />
      )}
    </div>
  )
}
