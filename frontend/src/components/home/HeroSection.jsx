import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ProductModal } from '@/components/admin/ProductModal'

export function HeroSection() {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [isModalOpen, setIsModalOpen] = useState(false)
    return (
        <section className="relative flex min-h-[85vh] items-center overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
                <img
                    src="/photos/pink_f1.webp"
                    alt="Custom hand-painted sneakers with vibrant street art designs"
                    className="h-full w-full object-cover"
                />
                {/* Overlay gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
                <div className="max-w-2xl">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Handcrafted Wearable Art</span>
                    </div>

                    <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                        Your Vision,
                        <br />
                        <span className="text-primary">Painted to Life</span>
                    </h1>

                    <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                        Design unique sneakers, hoodies, jackets, and tees with our
                        interactive customizer. Every piece is hand-painted by skilled
                        artists, crafted exclusively for you.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        {isAdmin ? (
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Product
                            </Button>
                        ) : (
                            <>
                                <Link to="/products">
                                    <Button
                                        size="lg"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Shop Collection
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link to="/customize">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-border text-foreground hover:bg-secondary"
                                    >
                                        Start Customizing
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <ProductModal 
                        isOpen={isModalOpen} 
                        onClose={() => setIsModalOpen(false)} 
                        onSaveSuccess={() => navigate('/products')}
                    />

                    {/* Social proof */}
                    <div className="mt-10 flex items-center gap-6">
                        <div className="flex -space-x-2">
                            {['MJ', 'SK', 'AR', 'DP'].map((initials) => (
                                <div
                                    key={initials}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-secondary text-[10px] font-medium text-foreground"
                                >
                                    {initials}
                                </div>
                            ))}
                        </div>
                        <div className="text-sm">
                            <span className="font-semibold text-foreground">2,400+</span>{' '}
                            <span className="text-muted-foreground">happy customers</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
