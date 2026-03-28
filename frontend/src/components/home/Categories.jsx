import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const categories = [
    {
        name: 'Custom Sneakers',
        slug: 'sneakers',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
        count: 5,
    },
    {
        name: 'Painted Hoodies',
        slug: 'hoodies',
        image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
        count: 3,
    },
    {
        name: 'Designer Jackets',
        slug: 'jackets',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
        count: 3,
    },
    {
        name: 'Personalized Tees',
        slug: 'tees',
        image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
        count: 2,
    },
]

export function Categories() {
    return (
        <section className="bg-secondary/30">
            <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Shop by Category
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                        Find the perfect canvas for your next masterpiece
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            to={`/products?category=${cat.slug}`}
                            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl"
                        >
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                            <div className="relative p-4">
                                <h3 className="text-lg font-semibold text-foreground">{cat.name}</h3>
                                <div className="mt-1 flex items-center gap-1 text-sm text-primary">
                                    <span>{cat.count} products</span>
                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
