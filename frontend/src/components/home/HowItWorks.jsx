import { Palette, MousePointerClick, Package } from 'lucide-react'

const steps = [
    {
        icon: MousePointerClick,
        title: 'Choose Your Item',
        description:
            'Browse our collection of premium sneakers, hoodies, jackets, and tees. Select your favorite base product.',
    },
    {
        icon: Palette,
        title: 'Customize Your Design',
        description:
            'Use our interactive 3D customizer to add images, text, stickers, and freehand art. Make it truly yours.',
    },
    {
        icon: Package,
        title: 'Receive Your Masterpiece',
        description:
            'Our skilled artists bring your design to life with hand-painted precision. Delivered to your door.',
    },
]

export function HowItWorks() {
    return (
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    How It Works
                </h2>
                <p className="mt-2 text-muted-foreground">Three simple steps to wearable art</p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {steps.map((step, i) => {
                    const Icon = step.icon
                    return (
                        <div key={step.title} className="relative flex flex-col items-center text-center">
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <div className="absolute top-8 right-0 hidden h-px w-full translate-x-1/2 bg-border md:block" />
                            )}
                            <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                <Icon className="h-7 w-7" />
                            </div>
                            <span className="mb-2 text-xs font-medium uppercase tracking-widest text-primary">
                                Step {i + 1}
                            </span>
                            <h3 className="mb-2 text-lg font-semibold text-foreground">{step.title}</h3>
                            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                {step.description}
                            </p>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
