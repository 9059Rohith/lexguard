export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 w-full rounded ${className}`} />
}

export function ContractCardSkeleton() {
  return (
    <div className="bg-bg-surface border border-white/[0.06] rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-32 rounded" />
      <div className="skeleton h-8 w-full rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-16 rounded-full" />
      </div>
    </div>
  )
}
