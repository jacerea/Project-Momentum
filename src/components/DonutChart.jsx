export default function DonutChart({ completed, total }) {
  const size = 160
  const strokeWidth = 20
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total > 0 ? completed / total : 0
  const dash = pct * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="#1a2537"
        strokeWidth={strokeWidth}
      />
      {completed > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--accent-mid)"
          strokeWidth={strokeWidth}
          // shave a few px off so the rounded cap doesn't visually overshoot at near-100%
          strokeDasharray={`${dash - 3} ${circumference - dash + 3}`}
          strokeLinecap="round"
          // SVG arcs default to starting at 3 o'clock — rotate to start at the top instead
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      <text
        x={cx}
        y={cy - 7}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="26"
        fontWeight="800"
        fontFamily="Syne, sans-serif"
      >
        {total > 0 ? `${Math.round(pct * 100)}%` : '—'}
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        fill="#4a5e78"
        fontSize="11"
        fontFamily="DM Sans, sans-serif"
      >
        complete
      </text>
    </svg>
  )
}
