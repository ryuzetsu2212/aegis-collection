export function formatChatTime(dateStr?: string | null): string {
  if (!dateStr) return ''
  let isoStr = dateStr.trim()
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    isoStr = isoStr.includes(' ') ? isoStr.replace(' ', 'T') + 'Z' : isoStr + 'Z'
  }
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
}

