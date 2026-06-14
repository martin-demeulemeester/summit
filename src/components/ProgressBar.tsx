interface Props {
  value: number
  max: number
  className?: string
}

export default function ProgressBar({ value, max, className = '' }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full bg-summit-surface2/70 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-summit-accent to-summit-accent2 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
