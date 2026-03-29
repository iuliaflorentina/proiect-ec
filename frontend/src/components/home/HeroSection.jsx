import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Plus, Ticket, X, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { ProductModal } from '@/components/admin/ProductModal'

export function HeroSection() {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [promo, setPromo] = useState(null)
    const [showPopup, setShowPopup] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchPromo = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/coupons/active`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.length > 0) {
                        const activePromo = data[0]
                        setPromo(activePromo)
                        
                        const hidden = sessionStorage.getItem('promo_popup_hidden')
                        if (!hidden) {
                            console.log('Valid promo found! Showing popup modal.')
                            setTimeout(() => setShowPopup(true), 1000) 
                        } else {
                            console.log('Promo active but user already saw the popup this session.')
                        }
                    } else {
                        console.log('No active coupons found in database.')
                    }
                }
            } catch (e) { console.error(e) }
        }
        fetchPromo()
    }, [])

    const handleCopy = () => {
        if (!promo) return
        navigator.clipboard.writeText(promo.code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const closePopup = () => {
        setShowPopup(false)
        sessionStorage.setItem('promo_popup_hidden', 'true')
    }

    return (
        <>
        <section className="relative flex min-h-[85vh] items-center overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
                <img
                    src="/photos/pink_f1.webp"
                    alt="Custom hand-painted sneakers"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8">
                <div className="max-w-2xl">
                    {/* Badge & Promo */}
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Handcrafted Wearable Art</span>
                        </div>
                        
                        {promo && (
                            <Link to="/customize" className="group">
                                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-500 hover:bg-green-500/20 transition-all font-bold animate-pulse">
                                    <Ticket className="h-3.5 w-3.5" />
                                    <span>{promo.code}: {promo.type === 'percent' ? `${promo.value}%` : `$${promo.value}`} OFF</span>
                                </div>
                            </Link>
                        )}
                    </div>

                    <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl font-orbitron">
                        Your Vision,
                        <br />
                        <span className="text-primary">Painted to Life</span>
                    </h1>

                    <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground font-inter">
                        Design unique sneakers, hoodies, and tees with our
                        interactive customizer. Every piece is hand-painted by skilled
                        artists, crafted exclusively for you.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        {isAdmin ? (
                            <Button
                                size="lg"
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                                onClick={() => setIsProductModalOpen(true)}
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
                                        className="border-border text-foreground hover:bg-secondary font-orbitron tracking-widest"
                                    >
                                        Start Customizing
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <ProductModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onSaveSuccess={() => navigate('/products')}
            />
        </section>

        {/* Promo Popup Modal */}
        {showPopup && promo && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-300">
                    {/* Header Decoration */}
                    <div className="h-24 bg-gradient-to-br from-primary to-purple-600 p-6 flex items-center justify-between text-white">
                        <div>
                            <h2 className="text-2xl font-black font-orbitron italic">BIG SAVINGS!</h2>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Limited Time Offer</p>
                        </div>
                        <Ticket className="h-12 w-12 opacity-20 -rotate-12" />
                    </div>

                    <button 
                        onClick={closePopup}
                        className="absolute top-4 right-4 p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="p-8 text-center bg-card">
                        <div className="mb-6">
                            <p className="text-4xl font-black text-foreground font-orbitron mb-2">
                                {promo.type === 'percent' ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                            </p>
                            <p className="text-sm text-muted-foreground font-inter">
                                Use this code at checkout to unlock your exclusive discount on all custom orders.
                            </p>
                        </div>

                        <div className="relative group cursor-pointer" onClick={handleCopy}>
                            <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4 transition-all hover:bg-primary/10">
                                <span className="text-2xl font-black text-primary font-orbitron tracking-[0.2em]">{promo.code}</span>
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg group-hover:scale-110 transition-transform">
                                    {copied ? <CheckCircle className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                </div>
                            </div>
                            <p className="mt-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {copied ? 'Copied to Clipboard!' : 'Click to Copy Code'}
                            </p>
                        </div>

                        <div className="mt-8">
                            <Button className="w-full h-12 text-base font-black font-orbitron tracking-widest" onClick={closePopup}>
                                START SHOPPING
                            </Button>
                        </div>
                    </div>
                    
                    {/* Footer condition */}
                    {promo.minAmount > 0 && (
                        <div className="bg-secondary/30 p-3 text-center border-t border-border">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                * Valid on orders over ${promo.minAmount}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        )}
        </>
    )
}
