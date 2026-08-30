import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function getCustomerDisplayName(order: {
  purchase_type?: string
  shipping_address?: string
  user_full_name?: string | null
  user_email?: string | null
}): string {
  const addr = order.shipping_address || ''
  const match = addr.match(/\(a\.n\.\s*([^)]+)\)/i)
  if (match && match[1] && match[1].trim()) {
    return match[1].trim()
  }
  if (order.purchase_type === 'direct') {
    return 'Umum (Walk-in)'
  }
  return order.user_full_name || order.user_email || 'Umum (Walk-in)'
}

export function formatDateTime(dateStr?: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  let isoStr = dateStr.trim()
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    isoStr = isoStr.includes(' ') ? isoStr.replace(' ', 'T') + 'Z' : isoStr + 'Z'
  }
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString('id-ID', options || {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
