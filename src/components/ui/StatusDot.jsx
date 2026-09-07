const COLORS = {
  ok: 'var(--lime-bright)',
  warn: 'var(--amber)',
  off: 'var(--red)',
}

export default function StatusDot({ status = 'off', pulse = true, size = 8 }) {
  const color = COLORS[status] || COLORS.off
  return (
    <span
      className={pulse && status === 'ok' ? 'status-pulse inline-block rounded-full' : 'inline-block rounded-full'}
      style={{ width: size, height: size, backgroundColor: color, color }}
    />
  )
}
