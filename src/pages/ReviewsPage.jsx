import { useState } from 'react'
import { Star, ThumbsUp } from 'lucide-react'
import { testimonials } from '@/lib/data'

export default function ReviewsPage() {
    const [sortBy, setSortBy] = useState('recent')
    const avgRating = testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length

    const sorted = [...testimonials].sort((a, b) =>
        sortBy === 'highest' ? b.rating - a.rating : 0
    )

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Customer Reviews
            </h1>
            <p className="mb-8 text-muted-foreground">What our customers are saying</p>

            {/* Rating summary */}
            <div className="mb-10 flex flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 sm:flex-row">
                <div className="text-center">
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
                    <p className="mt-1 text-sm text-muted-foreground">
                        {testimonials.length} reviews
                    </p>
                </div>

                {/* Rating bars */}
                <div className="flex-1 w-full space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = testimonials.filter((t) => t.rating === stars).length
                        const pct = (count / testimonials.length) * 100
                        return (
                            <div key={stars} className="flex items-center gap-3 text-sm">
                                <span className="w-6 text-right text-muted-foreground">{stars}</span>
                                <Star className="h-3 w-3 fill-primary text-primary" />
                                <div className="flex-1 rounded-full bg-secondary h-2">
                                    <div
                                        className="h-2 rounded-full bg-primary transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="w-8 text-muted-foreground">{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Sort */}
            <div className="mb-6 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{testimonials.length} Reviews</h2>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                </select>
            </div>

            {/* Reviews */}
            <div className="space-y-4">
                {sorted.map((review) => (
                    <div
                        key={review.id}
                        className="rounded-xl border border-border bg-card p-6"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {review.avatar}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-foreground">{review.name}</p>
                                        {review.verified && (
                                            <span className="text-xs text-primary">✓ Verified</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{review.location}</p>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                                ))}
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">"{review.text}"</p>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Product: <span className="text-foreground">{review.product}</span>
                        </p>
                        <button className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <ThumbsUp className="h-3.5 w-3.5" /> Helpful
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
