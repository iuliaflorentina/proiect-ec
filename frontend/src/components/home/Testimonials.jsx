import { useState, useEffect } from 'react'
import { Star, Loader2, Quote } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function Testimonials() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await fetch(`${API}/api/reviews`)
                if (res.ok) {
                    const data = await res.json()
                    // Show latest 4 reviews on homepage
                    setReviews(data.slice(0, 4))
                }
            } catch (error) {
                console.error('Error fetching testimonials:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchReviews()
    }, [])

    if (!loading && reviews.length === 0) return null

    return (
        <section className="bg-secondary/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            
            <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        What Our Customers Say
                    </h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
                        Real stories from real wearable art lovers
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {reviews.map((r) => (
                            <div
                                key={r.id}
                                className="group relative flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                            >
                                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/5 transition-colors group-hover:text-primary/10" />
                                
                                <div className="flex gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Number(r.rating) ? 'fill-primary text-primary' : 'fill-muted text-muted'}`}
                                        />
                                    ))}
                                </div>

                                <p className="flex-1 text-sm leading-relaxed text-muted-foreground italic">
                                    "{r.comment}"
                                </p>

                                <div className="flex items-center gap-3 border-t border-border pt-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary border border-primary/20">
                                        {(r.userName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground leading-none">{r.userName}</p>
                                        {r.verified && <p className="mt-1 text-[10px] font-bold text-primary uppercase tracking-widest">Verified Purchase</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
