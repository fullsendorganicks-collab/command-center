import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts'

export default function Sparkline({ data = [], color = 'var(--accent)', height = 90 }) {
  const points = data.map((v, i) => ({ i, v }))
  const gradId = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${gradId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
