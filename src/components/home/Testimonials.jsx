import { Star } from 'lucide-react'
import { testimonials } from '@/lib/data'

export function Testimonials() {
    return (
        <section className="bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        What Our Customers Say
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Real stories from real wearable art lovers
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {testimonials.map((t) => (
                        <div
                            key={t.id}
                            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-4 w-4 fill-primary text-primary"
                                    />
                                ))}
                            </div>

                            {/* Text */}
                            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                                "{t.text}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 border-t border-border pt-4">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                                    <p className="text-xs text-muted-foreground">{t.location}</p>
                                </div>
                                {t.verified && (
                                    <span className="ml-auto text-xs text-primary">✓ Verified</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
