import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Star, ShoppingCart, SlidersHorizontal, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { products } from '@/lib/data'
import { useCart } from '@/context/CartContext'

const CATEGORIES = ['All', 'sneakers', 'hoodies', 'jackets', 'tees']

export default function ProductsPage() {
    const [activeCategory, setActiveCategory] = useState('All')
    const [customizableOnly, setCustomizableOnly] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const { addItem } = useCart()
    const [added, setAdded] = useState({})

    const searchQuery = searchParams.get('search') || ''

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (activeCategory !== 'All' && p.category !== activeCategory) return false
            if (customizableOnly && !p.customizable) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const matchesName = p.name.toLowerCase().includes(query)
                const matchesCategory = p.category.toLowerCase().includes(query)
                const matchesArtist = p.artist?.toLowerCase().includes(query)
                if (!matchesName && !matchesCategory && !matchesArtist) return false
            }
            return true
        })
    }, [activeCategory, customizableOnly, searchQuery])

    const handleAdd = (product) => {
        addItem(product)
        setAdded((prev) => ({ ...prev, [product.id]: true }))
        setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1500)
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {searchQuery ? `Results for "${searchQuery}"` : 'Shop Collection'}
                </h1>
                <div className="mt-2 flex items-center justify-between">
                    <p className="text-muted-foreground">
                        {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'} of wearable art
                    </p>
                    {searchQuery && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                searchParams.delete('search')
                                setSearchParams(searchParams)
                            }}
                            className="text-primary hover:text-primary/80 h-auto p-0 flex items-center gap-1"
                        >
                            <X className="h-3 w-3" /> Clear search
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeCategory === cat
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                                }`}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setCustomizableOnly(!customizableOnly)}
                    className={`ml-auto flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${customizableOnly
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Customizable Only
                </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((product) => (
                    <div
                        key={product.id}
                        className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5"
                    >
                        {/* Image */}
                        <div className="relative aspect-square overflow-hidden">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {product.badge && (
                                <div className="absolute left-3 top-3">
                                    <Badge>{product.badge}</Badge>
                                </div>
                            )}
                            {product.customizable && (
                                <div className="absolute right-3 top-3">
                                    <Badge variant="secondary">Customizable</Badge>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-1 flex-col p-4">
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                            <h3 className="mt-1 font-semibold text-foreground leading-snug">{product.name}</h3>

                            {/* Rating */}
                            <div className="mt-2 flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-3 w-3 ${i < Math.floor(product.rating)
                                                ? 'fill-primary text-primary'
                                                : 'fill-muted text-muted'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-xs text-muted-foreground">({product.reviews})</span>
                            </div>

                            {/* Price & Add */}
                            <div className="mt-auto flex items-center justify-between pt-4">
                                <div>
                                    <span className="text-lg font-bold text-foreground">${product.price}</span>
                                    {product.originalPrice && (
                                        <span className="ml-2 text-sm text-muted-foreground line-through">
                                            ${product.originalPrice}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {product.customizable && (
                                        <Link to="/customize">
                                            <Button variant="outline" size="sm" className="h-9 px-3 text-xs">
                                                Customize
                                            </Button>
                                        </Link>
                                    )}
                                    <Button
                                        size="icon"
                                        onClick={() => handleAdd(product)}
                                        className={`h-9 w-9 transition-all ${added[product.id] ? 'bg-green-600 hover:bg-green-600' : ''
                                            }`}
                                    >
                                        {added[product.id] ? '✓' : <ShoppingCart className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
