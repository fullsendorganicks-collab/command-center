import { useEffect, useState } from 'react'

/**
 * Semi-circular SVG gauge dial. Animates stroke-dashoffset on mount/value
 * change. Color transitions red -> amber -> green based on value (0-100).
 */
export default function GaugeDial({ value = 0, label, sublabel, size = 110 }) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 60)
    return () => clearTimeout(t)
  }, [value])

  const radius = size / 2 - 10
  const circumference = Math.PI * radius // semicircle
  const offset = circumference - (Math.min(100, Math.max(0, animated)) / 100) * circumference

  const color = animated >= 70 ? 'var(--lime-bright)' : animated >= 40 ? 'var(--amber)' : 'var(--red)'

  const cx = size / 2
  const cy = size / 2

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
        <path
          d={`M 10 ${cy} A ${radius} ${radius} 0 0 1 ${size - 10} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={8}
          strokeLinecap="round"
        />
        <path
          d={`M 10 ${cy} A ${radius} ${radius} 0 0 1 ${size - 10} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1), stroke 400ms ease' }}
        />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill="var(--text-headline)">
          {Math.round(animated)}
        </text>
      </svg>
      {label && <div className="text-xs text-body-c text-center leading-tight mt-0.5">{label}</div>}
      {sublabel && <div className="text-[11px] text-faint-c text-center leading-tight">{sublabel}</div>}
    </div>
  )
}
