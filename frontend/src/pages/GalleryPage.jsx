import { useState } from 'react'
import { galleryItems } from '@/lib/data'

const CATEGORIES = ['All', 'sneakers', 'hoodies', 'jackets', 'tees']

export default function GalleryPage() {
    const [active, setActive] = useState('All')

    const filtered =
        active === 'All' ? galleryItems : galleryItems.filter((g) => g.category === active)

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
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
                {filtered.map((item) => (
                    <div
                        key={item.id}
                        className="group mb-4 overflow-hidden rounded-xl break-inside-avoid cursor-pointer"
                    >
                        <div className="relative overflow-hidden">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                <p className="text-xs text-muted-foreground">by {item.artist}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
