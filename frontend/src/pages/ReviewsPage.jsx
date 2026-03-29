import { useState, useEffect } from 'react'
import { Star, ThumbsUp, Loader2, MessageSquare } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ReviewsPage() {
    const [reviews, setReviews] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [sortBy, setSortBy] = useState('recent')

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch(`${API}/api/reviews`)
                if (res.ok) {
                    const data = await res.json()
                    setReviews(data)
                }
            } catch (err) {
                console.error('Error fetching reviews:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchReviews()
    }, [])

    const avgRating = reviews.length > 0 
        ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length 
        : 0

    const sorted = [...reviews].sort((a, b) => {
        if (sortBy === 'highest') return b.rating - a.rating
        // Default to most recent
        const timeA = a.createdAt?._seconds || a.createdAt?.seconds || 0
        const timeB = b.createdAt?._seconds || b.createdAt?.seconds || 0
        return timeB - timeA
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading genuine reviews...</p>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Customer Reviews
            </h1>
            <p className="mb-8 text-muted-foreground">What our community is saying about their custom art</p>

            {/* Rating summary */}
            <div className="mb-10 flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 sm:flex-row shadow-sm">
                <div className="text-center sm:border-r border-border sm:pr-8">
                    <div className="text-6xl font-bold text-foreground">{avgRating.toFixed(1)}</div>
                    <div className="mt-2 flex justify-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                className={`h-5 w-5 ${i < Math.round(avgRating)
                                        ? 'fill-primary text-primary'
                                        : 'fill-muted text-muted'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {reviews.length} Verified Reviews
                    </p>
                </div>

                {/* Rating bars */}
                <div className="flex-1 w-full space-y-3">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter((r) => Number(r.rating) === stars).length
                        const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
                        return (
                            <div key={stars} className="flex items-center gap-4 text-sm group/bar">
                                <div className="flex w-7 items-center justify-end gap-1">
                                    <span className="font-bold text-foreground">{stars}</span>
                                    <Star className="h-3 w-3 fill-primary text-primary" />
                                </div>
                                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-secondary/50 border border-border/5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(var(--primary-rgb),0.2)]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="w-12 text-right">
                                    <span className="text-xs font-mono font-medium text-muted-foreground group-hover/bar:text-primary transition-colors">
                                        {pct}%
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Controls */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Latest Feedback
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Sort By:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all appearance-none cursor-pointer hover:border-primary/50"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="highest">Highest Rated</option>
                    </select>
                </div>
            </div>

            {/* Reviews Grid */}
            {reviews.length === 0 ? (
                <div className="py-20 text-center rounded-3xl border-2 border-dashed border-border bg-muted/20">
                    <p className="text-muted-foreground font-medium">No reviews yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {sorted.map((review) => (
                        <div
                            key={review.id}
                            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary border border-primary/20">
                                        {(review.userName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-foreground">{review.userName}</p>
                                            {review.verified && (
                                                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase border border-primary/20">
                                                    Verified Purchase
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {review.createdAt?._seconds 
                                                ? new Date(review.createdAt._seconds * 1000).toLocaleDateString() 
                                                : 'Recently'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                            key={i} 
                                            className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'fill-muted text-muted'}`} 
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="mt-5 text-sm leading-relaxed text-muted-foreground italic font-medium">"{review.comment}"</p>
                            
                            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Product: <span className="text-foreground">{review.productName}</span>
                                </p>
                                <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
                                    <ThumbsUp className="h-3.5 w-3.5" /> 
                                    <span>Helpful</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
