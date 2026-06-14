interface Props {
  value: number
  max: number
  className?: string
}

export default function ProgressBar({ value, max, className = '' }: Props) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full border-2 border-summit-line bg-summit-surface2 ${className}`}>
      <div
        className="h-full rounded-full bg-[repeating-linear-gradient(135deg,#ff5a1f_0_10px,#ff7b45_10px_20px)] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
