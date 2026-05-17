import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  goldHover?: boolean
}

export function Card({ hover = true, goldHover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-surface border border-white/[0.06] rounded-xl transition-all duration-200',
        hover && 'hover:-translate-y-0.5 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30',
        goldHover && 'hover:border-gold/30 hover:shadow-gold/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
