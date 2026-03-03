import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
    return (
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-6 py-16 text-center sm:px-12">
                {/* Background decoration */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Start Creating Today</span>
                    </div>

                    <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                        Ready to Wear Your Art?
                    </h2>

                    <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
                        Join thousands of happy customers who wear their story. Design your
                        piece today and our artists will bring it to life within 7–14 days.
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Link to="/products">
                            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Start Customizing
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link to="/gallery">
                            <Button size="lg" variant="outline">
                                Browse Gallery
                            </Button>
                        </Link>
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground">
                        Free shipping on orders over $150 · 30-day satisfaction guarantee
                    </p>
                </div>
            </div>
        </section>
    )
}
