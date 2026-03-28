import { Link } from 'react-router-dom'
import { Palette, Instagram, Twitter, Facebook, Youtube } from 'lucide-react'

export function Footer() {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Palette className="h-4 w-4" />
                            </span>
                            <span>BrushCraft Co.</span>
                        </Link>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            Wearable art, hand-crafted by skilled artists. Every piece is unique to you.
                        </p>
                        <div className="mt-4 flex gap-3">
                            {[Instagram, Twitter, Facebook, Youtube].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                >
                                    <Icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Shop
                        </h3>
                        <ul className="space-y-2">
                            {['Custom Sneakers', 'Painted Hoodies', 'Designer Jackets', 'Personalized Tees', 'Gallery'].map((item) => (
                                <li key={item}>
                                    <Link
                                        to="/products"
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Company
                        </h3>
                        <ul className="space-y-2">
                            {['About Us', 'Artists', 'How It Works', 'Blog', 'Careers'].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                            Support
                        </h3>
                        <ul className="space-y-2">
                            {['FAQ', 'Shipping & Returns', 'Care Instructions', 'Custom Orders', 'Contact Us'].map((item) => (
                                <li key={item}>
                                    <a
                                        href="#"
                                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
                    <p className="text-sm text-muted-foreground">
                        © 2024 BrushCraft Co. All rights reserved.
                    </p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
