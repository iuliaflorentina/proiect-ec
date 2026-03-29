import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    ChevronLeft, Image as ImageIcon, Download, ShoppingCart, Trash2, Sparkles, ArrowRight, Upload, Layers, MoveUp, MoveDown, Copy, Settings2, Loader2, LayoutDashboard, Search
} from 'lucide-react'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { compressImage } from '@/lib/optimize'
import { saveAsset, getAsset } from '@/lib/db' 
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'

import ProductViewer2D from '@/components/customizer/ProductViewer2D'
import ProductViewer3D from '@/components/customizer/ProductViewer3D'

const STICKERS = [
    { id: 'fire', src: 'https://cdn-icons-png.flaticon.com/512/426/426833.png' },
    { id: 'star', src: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
    { id: 'lightning', src: 'https://cdn-icons-png.flaticon.com/512/911/911520.png' },
    { id: 'heart', src: 'https://cdn-icons-png.flaticon.com/512/1077/1077035.png' },
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const DEFAULT_COLORS = [
    '#ffffff', '#000000', '#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#fbbf24'
]

const CustomizerPage = () => {
    const { addItem } = useCart()
    const { isAdmin } = useAuth()
    const location = useLocation()
    const navigate = useNavigate()

    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(false)

    // Selection State - Initialize from location state if available (for cart/admin view)
    const [selectedProduct, setSelectedProduct] = useState(() => {
        if (location.state?.productPayload) {
            return location.state.productPayload
        }
        return null
    })

    const fetchProducts = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(`${API}/api/products`)
            if (res.ok) {
                const data = await res.json()
                setProducts(data)
                
                // If we only had a productId but no payload, OR if the current payload is incomplete (missing modelPath)
                const currentId = selectedProduct?.productId || selectedProduct?.id || location.state?.productId
                if (currentId) {
                    const found = data.find(p => p.id === currentId)
                    if (found) {
                        // Merge the items: local customizations win, but full product meta-data (like modelPath) is added
                        setSelectedProduct(prev => ({ 
                            ...found, 
                            ...prev, 
                            modelPath: found.modelPath // Force the correct model path!
                        }))
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!selectedProduct) {
            fetchProducts()
        }
    }, [selectedProduct])
    
    const [activeView, setActiveView] = useState('front') // 'front' or 'back' for 2D

    // 2D & 3D Customization Shared State - Initialize from location state if available
    const [stickers, setStickers] = useState(() => {
        return location.state?.customization?.stickers || { front: [], back: [] }
    })
    
    const [decals3D, setDecals3D] = useState(() => {
        return location.state?.customization?.decals3D || []
    })
    
    const [activeTab, setActiveTab] = useState('stickers')
    const [selectedId, setSelectedId] = useState(null)
    const [activeSticker, setActiveSticker] = useState(null) // selected sticker to place on 3D
    
    const [selectedColor, setSelectedColor] = useState(() => {
        return location.state?.customization?.selectedColor || '#ffffff'
    })

    const [baseColor, setBaseColor] = useState(() => {
        return location.state?.customization?.baseColor || '#ffffff'
    })

    const [isSaving, setIsSaving] = useState(false)
    const [resolvedUrls, setResolvedUrls] = useState({}) // { 'local:id': 'blob:...' }
    const isReadOnly = location.state?.readOnly === true
    const viewerRef = useRef()

    const [iconSearch, setIconSearch] = useState('')
    const [iconResults, setIconResults] = useState([])
    const [isSearchingIcons, setIsSearchingIcons] = useState(false)

    useEffect(() => {
        if (!iconSearch || iconSearch.length < 2) {
            setIconResults([])
            return
        }

        const timeoutId = setTimeout(async () => {
            setIsSearchingIcons(true)
            try {
                const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(iconSearch)}&limit=32`)
                if (res.ok) {
                    const data = await res.json()
                    // Map to full SVG URLs through our proxy
                    const icons = (data.icons || []).map(icon => {
                        const [prefix, name] = icon.split(':')
                        // Request a higher resolution (512px height) and white color so we can tint it later!
                        const url = `https://api.iconify.design/${prefix}/${name}.svg?height=512&color=white`
                        return {
                            id: icon,
                            src: url
                        }
                    })
                    setIconResults(icons)
                }
            } catch (err) {
                console.error('Error searching icons:', err)
            } finally {
                setIsSearchingIcons(false)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [iconSearch])

    useEffect(() => {
        if (selectedId && selectedColor) {
            if (selectedProduct.type === '3d') {
                setDecals3D(prev => prev.map(d => d.id === selectedId ? { ...d, color: selectedColor } : d))
            } else {
                setStickers(prev => {
                    const current = prev[activeView] || []
                    if (current.some(s => s.id === selectedId)) {
                        return { 
                            ...prev, 
                            [activeView]: current.map(s => s.id === selectedId ? { ...s, color: selectedColor } : s)
                        }
                    }
                    return prev
                })
            }
        }
    }, [selectedColor, selectedId])

    const currentStickers = stickers[activeView] || []

    const handleProductSelect = (product) => {
        setSelectedProduct(product)
        setStickers({ front: [], back: [] })
        setDecals3D([])
        setActiveView('front')
        setSelectedId(null)
        setActiveTab('stickers')
        setActiveSticker(null)
        setSelectedColor('#ffffff')
    }

    const setCurrentStickers = (newStickers) => {
        setStickers(prev => ({ ...prev, [activeView]: newStickers }))
    }

    const handleAddSticker2D = (src) => {
        const newSticker = {
            id: `sticker-${Date.now()}`,
            src,
            x: 200,
            y: 200,
            width: 150,
            height: 150,
            rotation: 0,
            color: selectedColor
        }
        setCurrentStickers([...currentStickers, newSticker])
        setSelectedId(newSticker.id)
        setActiveTab('layers')
    }

    const handleAddDecal3D = (newDecal) => {
        setDecals3D([...decals3D, newDecal])
        setSelectedId(newDecal.id)
        setActiveTab('layers')
    }

    const handleUpdateDecal3D = (id, updates) => {
        setDecals3D(decals3D.map(d => d.id === id ? { ...d, ...updates } : d))
    }

    const handleDeleteDecal3D = () => {
        if (!selectedId) return
        setDecals3D(decals3D.filter(d => d.id !== selectedId))
        setSelectedId(null)
    }

    // Resolve local IndexedDB assets to blob URLs
    useEffect(() => {
    const resolve = async () => {
            const allSources = new Set()
            decals3D.forEach(d => { if (d.imageUrl?.startsWith('local:')) allSources.add(d.imageUrl) })
            Object.values(stickers).forEach(viewStickers => {
                viewStickers.forEach(s => { if (s.src?.startsWith('local:')) allSources.add(s.src) })
            })

            const newResolved = { ...resolvedUrls }
            let changed = false

            for (const source of allSources) {
                if (!newResolved[source]) {
                    const id = source.replace('local:', '')
                    const blob = await getAsset(id)
                    if (blob) {
                        newResolved[source] = URL.createObjectURL(blob)
                        changed = true
                    }
                }
            }
            if (changed) setResolvedUrls(newResolved)
        }
        resolve()
    }, [decals3D, stickers])

    const getDisplayUrl = (url) => {
        if (!url) return url
        if (resolvedUrls[url]) return resolvedUrls[url]
        
        // Use proxy for Firebase storage to bypass CORS in 3D viewers (essential for Admin)
        if (url.includes('firebasestorage.googleapis.com')) {
            return `${API}/api/proxy?url=${encodeURIComponent(url)}`
        }
        
        return url
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsSaving(true)
        try {
            // 1. Compress and convert to WebP
            const optimizedFile = await compressImage(file, { maxWidth: 512, quality: 0.7 });
            
            // 2. Save to IndexedDB (Instant, Offline, Persistent)
            const assetId = `design-${Date.now()}`
            await saveAsset(assetId, optimizedFile)
            const localSource = `local:${assetId}`

            if (selectedProduct?.type === '3d') {
                setActiveSticker({ src: localSource, id: 'uploaded' })
                setSelectedId(null)
            } else {
                handleAddSticker2D(localSource)
            }
        } catch (error) {
            console.error("Local save failed:", error)
            alert("Failed to save image locally. Please try again.")
        } finally {
            setIsSaving(false)
            e.target.value = ''
        }
    }

    const handleAddToCart = async () => {
        if (!selectedProduct) return
        
        const designId = `${selectedProduct.id}-${Date.now()}`
        
        if (selectedProduct.type === '3d') {
            addItem({
                id: `custom-${designId}`,
                name: `Custom ${selectedProduct.name}`,
                price: selectedProduct.price,
                image: selectedProduct.image,
                category: 'Custom',
                customizable: true,
                productId: selectedProduct.id,
                designId: designId,
                customization: { stickers, decals3D, selectedColor, baseColor }
            })
            alert('Custom 3D design added to cart!')
        } else {
            addItem({
                id: `custom-${designId}`,
                name: `Custom ${selectedProduct.name}`,
                price: selectedProduct.price,
                image: selectedProduct.image,
                category: 'Custom',
                customizable: true,
                productId: selectedProduct.id,
                designId: designId,
                customization: { stickers, selectedColor, baseColor } 
            })
            alert('Custom 2D design added to cart!')
        }
    }

    // Layer Controls (2D)
    const moveStickerUp = () => {
        if (!selectedId) return
        const idx = currentStickers.findIndex(s => s.id === selectedId)
        if (idx < currentStickers.length - 1) {
            const newStickers = [...currentStickers]
            const temp = newStickers[idx]
            newStickers[idx] = newStickers[idx + 1]
            newStickers[idx + 1] = temp
            setCurrentStickers(newStickers)
        }
    }

    const moveStickerDown = () => {
        if (!selectedId) return
        const idx = currentStickers.findIndex(s => s.id === selectedId)
        if (idx > 0) {
            const newStickers = [...currentStickers]
            const temp = newStickers[idx]
            newStickers[idx] = newStickers[idx - 1]
            newStickers[idx - 1] = temp
            setCurrentStickers(newStickers)
        }
    }

    const deleteSticker2D = () => {
        if (!selectedId) return
        setCurrentStickers(currentStickers.filter(s => s.id !== selectedId))
        setSelectedId(null)
    }

    const duplicateSticker2D = () => {
        if (!selectedId) return
        const target = currentStickers.find(s => s.id === selectedId)
        if (target) {
            const newSticker = { ...target, id: `sticker-${Date.now()}`, x: target.x + 20, y: target.y + 20 }
            setCurrentStickers([...currentStickers, newSticker])
            setSelectedId(newSticker.id)
        }
    }

    if (!selectedProduct) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center py-12 px-6">
                <div className="max-w-5xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
                            <Sparkles className="h-6 w-6 text-primary" />
                            Choose Your Canvas
                        </h1>
                        <p className="text-muted-foreground">Select a product to start your custom design journey.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p>Loading canvas options...</p>
                            </div>
                        ) : products.filter(p => p.type === '3d').length > 0 ? (
                            products.filter(p => p.type === '3d').map(product => (
                                <div
                                    key={product.id}
                                    className="group relative bg-card border border-border rounded-xl aspect-[4/5] overflow-hidden cursor-pointer hover:border-primary/50 transition-colors shadow-sm hover:shadow-md"
                                    onClick={() => handleProductSelect(product)}
                                >
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {product.type === '3d' && (
                                        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10">
                                            <Layers className="h-3 w-3" />
                                            3D MODEL
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/70 to-transparent p-6 pt-16">
                                        <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="font-semibold text-primary text-lg">${parseFloat(product.price).toFixed(2)}</span>
                                            <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-none">
                                                Customize <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-muted-foreground">
                                <p>No products found in the store.</p>
                                {isAdmin && (
                                    <Button variant="link" onClick={() => navigate('/')} className="mt-2">
                                        Go to Home to Add Products
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    const selectedDecal3D = decals3D.find(d => d.id === selectedId)

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            <header className="border-b border-border bg-background/50 backdrop-blur-md px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:bg-secondary/20" 
                        onClick={() => {
                            if (location.state?.productPayload) {
                                navigate(-1)
                            } else {
                                setSelectedProduct(null)
                            }
                        }}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                    </Button>
                    <div className="h-6 w-px bg-border hidden sm:block" />
                    <h1 className="text-sm font-semibold text-foreground uppercase tracking-widest hidden sm:flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {selectedProduct.name} {(selectedProduct.type === '3d' || !!selectedProduct.modelPath) ? '(3D)' : ''}
                    </h1>
                </div>

                {selectedProduct.type === '2d' && (
                    <div className="flex items-center bg-secondary/20 rounded-lg p-1 border border-border">
                        <button
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeView === 'front' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => { setActiveView('front'); setSelectedId(null) }}
                        >
                            Front
                        </button>
                        <button
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeView === 'back' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => { setActiveView('back'); setSelectedId(null) }}
                        >
                            Back
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary mr-4 hidden sm:block">${Number(selectedProduct.price || 0).toFixed(2)}</span>
                    
                    {isReadOnly ? (
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full hidden sm:block">
                                Read-Only Mode
                            </span>
                            <Button size="sm" className="gap-2 bg-secondary hover:bg-secondary/80 text-foreground" onClick={() => navigate('/admin')}>
                                <LayoutDashboard className="h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" className="gap-2 hidden md:flex">
                                <Download className="h-4 w-4" />
                                Save
                            </Button>
                            <Button size="sm" className="gap-2" onClick={handleAddToCart} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Add to Cart
                                        <ShoppingCart className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden flex-col md:flex-row">

                {/* Viewer Area */}
                <div className="flex-1 relative bg-secondary/5">
                    {(selectedProduct.type === '3d' || !!selectedProduct.modelPath) ? (
                        <ProductViewer3D
                            ref={viewerRef}
                            product={selectedProduct}
                            currentColor={baseColor}
                            decals={decals3D.map(d => ({ ...d, imageUrl: getDisplayUrl(d.imageUrl) }))}
                            activeSticker={activeSticker ? { ...activeSticker, src: getDisplayUrl(activeSticker.src) } : null}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            onAddDecal={handleAddDecal3D}
                            onUpdateDecal={handleUpdateDecal3D}
                            onPlaceSticker={() => setActiveSticker(null)}
                            readOnly={isReadOnly}
                        />
                    ) : (
                        <ProductViewer2D
                            product={selectedProduct}
                            frontOrBack={activeView}
                            baseColor={baseColor}
                            stickers={currentStickers.map(s => ({ ...s, src: getDisplayUrl(s.src) }))}
                            setStickers={setCurrentStickers}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            readOnly={isReadOnly}
                        />
                    )}
                </div>

                {/* Customizer Panel */}
                {!isReadOnly && (
                    <div className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-border bg-card overflow-y-auto flex flex-col">
                        <nav className="flex items-center border-b border-border bg-muted/30">
                        <button
                            onClick={() => setActiveTab('stickers')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${activeTab === 'stickers' ? 'text-primary bg-background border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <ImageIcon className="h-4 w-4" />
                            {selectedProduct.type === '3d' ? 'Decals Library' : 'Images'}
                        </button>
                        <button
                            onClick={() => setActiveTab('layers')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${activeTab === 'layers' ? 'text-primary bg-background border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Settings2 className="h-4 w-4" />
                            {selectedProduct.type === '3d' ? 'Decal Settings' : 'Layer Details'}
                        </button>
                    </nav>

                    <div className="p-6 space-y-8 flex-1">

                        {activeTab === 'stickers' && (
                            <div className="space-y-8">
                                <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Upload Your Photo</h3>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-secondary/5 hover:bg-secondary/10 hover:border-primary/50 transition-all">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground/70">SVG, PNG, JPG</p>
                                            </div>
                                            <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        </label>
                                    </div>
                                </section>

                                {selectedProduct.name.toLowerCase().includes('t-shirt') && (
                                    <section>
                                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Product Body Color</h3>
                                        <div className="flex bg-secondary/20 p-1 rounded-lg border border-border w-fit">
                                            <button
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${baseColor === '#ffffff' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                onClick={() => setBaseColor('#ffffff')}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-border bg-white" />
                                                WHITE
                                            </button>
                                            <button
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${baseColor === '#000000' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                onClick={() => setBaseColor('#000000')}
                                            >
                                                <div className="w-3 h-3 rounded-full border border-white/20 bg-black" />
                                                BLACK
                                            </button>
                                        </div>
                                    </section>
                                )}

                                <section>
                                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Choose Element Tint</h3>
                                    <div className="flex flex-wrap gap-3">
                                        {(selectedProduct.colors?.length > 0 ? selectedProduct.colors : DEFAULT_COLORS).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => setSelectedColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-primary scale-110 shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border/50 hover:scale-105'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-3 italic">Changes the color of your selected icons</p>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Add Elements</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (selectedProduct.type === '3d') {
                                                    setDecals3D([])
                                                    setSelectedId(null)
                                                } else {
                                                    setCurrentStickers([])
                                                    setSelectedId(null)
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            Clear All
                                        </Button>
                                    </div>

                                    {/* Iconify Search */}
                                    <div className="relative mb-6">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search millions of icons (e.g. music, coffee...)"
                                            value={iconSearch}
                                            onChange={(e) => setIconSearch(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-border rounded-xl bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                        {isSearchingIcons && (
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {/* Show Search Results if any, else show Default STICKERS */}
                                        {(iconSearch.length >= 2 ? iconResults : STICKERS).map((sticker) => {
                                            const isActive = selectedProduct.type === '3d' && activeSticker?.src === sticker.src && !selectedId
                                            return (
                                                <button
                                                    key={sticker.id}
                                                    onClick={() => {
                                                        if (selectedProduct.type === '3d') {
                                                            setActiveSticker(sticker)
                                                            setSelectedId(null) // clear selection to allow placing
                                                        } else {
                                                            handleAddSticker2D(sticker.src)
                                                        }
                                                    }}
                                                    className={`aspect-square p-2 rounded-xl border transition-all flex items-center justify-center ${isActive ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border bg-secondary/5 hover:border-primary/50 grayscale hover:grayscale-0'}`}
                                                >
                                                    <img src={getDisplayUrl(sticker.src)} alt={sticker.id} className="w-full h-full object-contain" />
                                                </button>
                                            )
                                        })}
                                        {iconSearch.length >= 2 && iconResults.length === 0 && !isSearchingIcons && (
                                            <div className="col-span-4 py-8 text-center text-xs text-muted-foreground">
                                                No results found for "{iconSearch}"
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'layers' && selectedProduct.type === '2d' && (
                            <section className="space-y-6">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Selected Layer Control</h3>

                                {!selectedId ? (
                                    <div className="text-center p-8 bg-secondary/5 border border-dashed border-border rounded-xl">
                                        <Layers className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">Select an element on the canvas to edit its layer properties.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 bg-secondary/5 p-4 rounded-xl border border-border">
                                        <p className="text-sm font-medium mb-3">Arrange Order</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="outline" size="sm" onClick={moveStickerUp} className="gap-2">
                                                <MoveUp className="h-4 w-4" />
                                                Bring Forward
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={moveStickerDown} className="gap-2">
                                                <MoveDown className="h-4 w-4" />
                                                Send Backward
                                            </Button>
                                        </div>
                                        <div className="pt-4 mt-4 border-t border-border grid grid-cols-2 gap-3">
                                            <Button variant="secondary" size="sm" onClick={duplicateSticker2D} className="gap-2">
                                                <Copy className="h-4 w-4" />
                                                Duplicate
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={deleteSticker2D} className="gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {activeTab === 'layers' && selectedProduct.type === '3d' && (
                            <section className="space-y-6">
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Selected Decal Properties</h3>

                                {!selectedDecal3D ? (
                                    <div className="text-center p-8 bg-secondary/5 border border-dashed border-border rounded-xl">
                                        <Settings2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">Click on an existing decal on the 3D model to edit its properties, or click anywhere else to move it!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6 bg-secondary/5 p-4 rounded-xl border border-border">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span>Scale (Size)</span>
                                                <span className="text-muted-foreground">{selectedDecal3D.scale.toFixed(1)}x</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="3"
                                                step="0.1"
                                                value={selectedDecal3D.scale}
                                                onChange={(e) => handleUpdateDecal3D(selectedId, { scale: parseFloat(e.target.value) })}
                                                className="w-full accent-primary"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span>Rotation</span>
                                                <span className="text-muted-foreground">{(selectedDecal3D.rotation * 180 / Math.PI).toFixed(0)}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="-3.14"
                                                max="3.14"
                                                step="0.1"
                                                value={selectedDecal3D.rotation}
                                                onChange={(e) => handleUpdateDecal3D(selectedId, { rotation: parseFloat(e.target.value) })}
                                                className="w-full accent-primary"
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border">
                                            <p className="text-sm font-medium">Fine-tune Position (Offsets)</p>
                                            
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span>Move X (Left/Right)</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[0] -= 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Left</Button>
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[0] += 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Right</Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span>Move Y (Up/Down)</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[1] -= 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Down</Button>
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[1] += 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Up</Button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                    <span>Move Z (Forward/Backward)</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[2] -= 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Back</Button>
                                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                                                        const newPos = [...selectedDecal3D.position];
                                                        newPos[2] += 0.05;
                                                        handleUpdateDecal3D(selectedId, { position: newPos });
                                                    }}>Forward</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <Button variant="destructive" size="sm" onClick={handleDeleteDecal3D} className="w-full gap-2">
                                                <Trash2 className="h-4 w-4" />
                                                Delete Decal
                                            </Button>
                                        </div>

                                        <p className="text-xs text-muted-foreground text-center mt-4">
                                            Tip: Click anywhere else on the shoe to instantly move this decal!
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </div>
                )}
            </main>
        </div>
    )
}

export default CustomizerPage
