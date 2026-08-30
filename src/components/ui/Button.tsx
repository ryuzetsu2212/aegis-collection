'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, disabled, children, ...props }, ref) => {
    const isBtnDisabled = Boolean(disabled || isLoading)
    return (
      <button
        ref={ref}
        disabled={isBtnDisabled ? true : undefined}
        suppressHydrationWarning
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-zinc-900 text-white hover:bg-zinc-800': variant === 'primary',
            'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700': variant === 'destructive',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
