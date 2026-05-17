import { cn, riskColor, riskBgColor, riskLabel } from '@/lib/utils'
import type { RiskLevel } from '@/lib/types'

interface RiskBadgeProps {
  level: RiskLevel | string
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  className?: string
}

export function RiskBadge({ level, size = 'md', pulse = false, className }: RiskBadgeProps) {
  const color = riskColor(level)
  const bg = riskBgColor(level)
  const label = riskLabel(level)

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-mono font-semibold rounded-full tracking-wider',
        sizeClasses[size],
        pulse && level === 'high' && 'risk-badge-high',
        pulse && level === 'moderate' && 'risk-badge-moderate',
        className
      )}
      style={{
        color,
        backgroundColor: bg,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0',
          pulse && 'animate-pulse'
        )}
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}
