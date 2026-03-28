// Use the same placeholder style as `Home.vue` for consistency.
export const getRecordPlaceholder = (id = 1) => {
  const colors = [
    '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    '#ef4444', '#f87171', '#fca5a5', '#fecaca',
    '#1f2937', '#374151', '#4b5563', '#6b7280',
    '#111827', '#1f2937', '#374151', '#4b5563'
  ]
  const safeId = Number.isFinite(Number(id)) ? Number(id) : 1
  const color = colors[(safeId || 1) % colors.length]
  const color2 = colors[((safeId || 1) + 1) % colors.length]

  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad${safeId || 1}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill="url(#grad${safeId || 1})"/>
      <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
      <circle cx="150" cy="150" r="50" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <circle cx="150" cy="150" r="20" fill="rgba(255,255,255,0.4)"/>
      <text x="150" y="200" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)" text-anchor="middle" font-weight="bold">💿</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

