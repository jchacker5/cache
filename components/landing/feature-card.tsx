import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
    title: string
    description: string
    icon: LucideIcon
    className?: string
}

export function FeatureCard({ title, description, icon: Icon, className }: FeatureCardProps) {
    return (
        <div className={cn(
            "group relative overflow-hidden rounded-xl border bg-background/50 p-6 hover:bg-background/80 transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
            className
        )}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold tracking-tight">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
