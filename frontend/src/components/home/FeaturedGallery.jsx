import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function FeaturedGallery() {
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await fetch(`${API}/api/gallery`)
                if (res.ok) {
                    const data = await res.json()
                    setItems(data)
                }
            } catch (err) {
                console.error('Gallery fetch failed:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchGallery()
    }, [])

    const featured = items.filter((item) => item.featured).slice(0, 6)

    if (isLoading) return (
        <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )

    if (items.length === 0) return null

    return (
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Featured Artworks
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Hand-painted masterpieces and unique custom designs
                    </p>
                </div>
                <Link
                    to="/gallery"
                    className="hidden items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:flex"
                >
                    View all
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Masonry-like grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {featured.map((item, i) => (
                    <Link
                        key={item.id}
                        to="/gallery"
                        className={`group relative overflow-hidden rounded-lg ${i === 0 || i === 3 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
                            }`}
                    >
                        <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 text-center">
                            <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <Link
                to="/gallery"
                className="mt-6 flex items-center justify-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 sm:hidden"
            >
                View full gallery
                <ArrowRight className="h-4 w-4" />
            </Link>
        </section>
    )
}
