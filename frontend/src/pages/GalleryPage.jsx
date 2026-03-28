import { useState, useEffect } from 'react'
import { Loader2, X, Maximize2, User, Tag, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CATEGORIES = ['All', 'sneakers', 'hoodies', 'jackets', 'tees']
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function GalleryPage() {
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [active, setActive] = useState('All')
    const [selectedItem, setSelectedItem] = useState(null)

    const fetchGallery = async () => {
        try {
            setIsLoading(true)
            const res = await fetch(`${API}/api/gallery`)
            if (res.ok) {
                const data = await res.json()
                setItems(data)
            }
        } catch (error) {
            console.error('Error fetching gallery:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchGallery()
    }, [])

    const filtered =
        active === 'All' ? items : items.filter((g) => g.category === active)

    return (
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Artwork Gallery
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Explore hand-painted masterpieces from our community
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActive(cat)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active === cat
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Masonry Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="animate-pulse">Loading gallery wonders...</p>
                </div>
            ) : items.length > 0 ? (
                <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="group mb-4 overflow-hidden rounded-xl break-inside-avoid cursor-pointer bg-card border border-border/50 hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
                            onClick={() => setSelectedItem(item)}
                        >
                            <div className="relative overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 via-background/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                        </div>
                                        <Maximize2 className="h-4 w-4 text-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground">No masterpieces found in the gallery yet.</p>
                </div>
            )}

            {/* Image Modal Lightbox */}
            {selectedItem && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedItem(null)}
                >
                    <div 
                        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col lg:flex-row bg-card rounded-2xl overflow-hidden shadow-2xl border border-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-4 right-4 z-10 bg-background/50 hover:bg-background h-10 w-10 rounded-full"
                            onClick={() => setSelectedItem(null)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        <div className="lg:w-2/3 h-[50vh] lg:h-auto overflow-hidden bg-black/20">
                            <img 
                                src={selectedItem.image} 
                                alt={selectedItem.title} 
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div className="lg:w-1/3 p-8 flex flex-col justify-center gap-6">
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{selectedItem.title}</h2>
                            </div>

                            <hr className="border-border" />

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Tag className="h-5 w-5" />
                                    <span>Category: <span className="text-foreground capitalize font-medium">{selectedItem.category}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Calendar className="h-5 w-5" />
                                    <span>Published: <span className="text-foreground font-medium">
                                        {selectedItem.createdAt?.seconds 
                                            ? new Date(selectedItem.createdAt.seconds * 1000).toLocaleDateString()
                                            : 'Just now'}
                                    </span></span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Button 
                                    className="w-full h-12 text-lg font-bold gap-2"
                                    onClick={() => setSelectedItem(null)}
                                >
                                    Close Preview
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
