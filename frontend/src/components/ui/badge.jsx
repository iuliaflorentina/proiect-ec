import { cn } from '@/lib/utils'

function Badge({ className, variant = 'default', children, ...props }) {
    const variants = {
        default: 'bg-primary/10 text-primary border border-primary/30',
        secondary: 'bg-secondary text-secondary-foreground border border-border',
        outline: 'border border-border text-foreground',
    }

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    )
}

export { Badge }
