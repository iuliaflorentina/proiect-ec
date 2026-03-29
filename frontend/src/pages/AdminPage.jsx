import { useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Package, User, Calendar, DollarSign, Sparkles, Download, Database, Loader2, Image as ImageIcon, Trash2, Edit, Plus, Palette, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
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
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-muted-foreground">All orders placed on the platform</p>
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
      </div>

      {activeTab === 'orders' ? (
        <>
          {orders.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet.</p>
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
                                {/* Design Preview Thumbnail */}
                                <div className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted shrink-0 shadow-sm transition-transform hover:scale-110">
                                   {item.metadataUrl || item.image ? (
                                      <img 
                                        src={item.metadataUrl || item.image} 
                                        alt={item.name} 
                                        className="h-full w-full object-cover" 
                                      />
                                   ) : (
                                      <div className="flex h-full w-full items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                                      </div>
                                   )}
                                </div>

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
                                              ...item, 
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

                        <td className="px-6 py-4 font-semibold text-foreground">
                          ${parseFloat(order.total || 0).toFixed(2)}
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
        </>
      ) : (
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

          {gallery.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">The gallery is currently empty.</p>
              <Button variant="link" onClick={seedGallery} className="mt-2 text-primary">Seed initial artworks</Button>
            </div>
          ) : (
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
          )}
        </>
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
