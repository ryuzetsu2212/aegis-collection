'use client'

import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'
import { Button } from './Button'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'success' | 'warning' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          iconBg: 'bg-red-100',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        }
      case 'success':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
          iconBg: 'bg-emerald-100',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        }
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          iconBg: 'bg-amber-100',
          buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        }
      default:
        return {
          icon: <HelpCircle className="h-6 w-6 text-zinc-900" />,
          iconBg: 'bg-zinc-100',
          buttonClass: 'bg-zinc-900 hover:bg-zinc-800 text-white',
        }
    }
  }

  const { icon, iconBg, buttonClass } = getVariantStyles()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 no-print print:hidden">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-zinc-100 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-900 leading-snug">{title}</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs py-2 px-4 font-semibold text-zinc-700 hover:bg-zinc-100 border-zinc-200"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-xs py-2 px-4 font-bold shadow-sm ${buttonClass}`}
          >
            {isLoading ? 'Memproses...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

