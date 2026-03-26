import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, User, Menu, X, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/CartContext'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const location = useLocation()
    const navigate = useNavigate()
    const { items } = useCart()
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
            setSearchQuery('')
        }
    }

    const navLinks = [
        { label: 'Shop', href: '/products' },
        { label: 'Customize', href: '/customize' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Reviews', href: '/reviews' },
        { label: 'How It Works', href: '/#how-it-works' },
    ]

    const isActive = (href) => {
        if (href.startsWith('/#')) return false
        return location.pathname === href
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Palette className="h-4 w-4" />
                    </span>
                    <span>BrushCraft Co.</span>
                </Link>

                {/* Search Bar */}
                <div className="hidden flex-1 max-w-sm mx-8 md:block">
                    <form onSubmit={handleSearch} className="relative group">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-full border border-border bg-secondary/50 px-9 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 group-hover:bg-secondary/80"
                        />
                    </form>
                </div>

                {/* Desktop Nav - Moved right if needed, but keeping it visible */}
                <nav className="hidden items-center gap-6 lg:flex">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            to={link.href}
                            className={`text-sm font-medium transition-colors hover:text-primary ${isActive(link.href)
                                ? 'text-primary'
                                : 'text-muted-foreground'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Search className="h-4 w-4" />
                    </Button>
                    <Link to="/auth/login">
                        <Button variant="ghost" size="icon" className="hidden sm:flex">
                            <User className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link to="/cart">
                        <Button variant="ghost" size="icon" className="relative">
                            <ShoppingCart className="h-4 w-4" />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                    {cartCount}
                                </span>
                            )}
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="border-t border-border bg-background md:hidden">
                    <nav className="flex flex-col gap-1 px-4 py-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary ${isActive(link.href)
                                    ? 'bg-secondary text-foreground'
                                    : 'text-muted-foreground'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link
                            to="/auth/login"
                            onClick={() => setIsOpen(false)}
                            className="mt-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                        >
                            Sign In
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
