'use client'

import { Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

function PaginationContent({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '')
    params.set('page', String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  return (
    <div className="flex justify-center items-center gap-3 mt-8">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={isFirstPage}
        aria-label="Halaman Sebelumnya"
        className="p-2 bg-white text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:text-zinc-400 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
      </button>
      <span className="text-sm font-medium text-zinc-700 select-none">
        Halaman {currentPage} dari {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={isLastPage}
        aria-label="Halaman Selanjutnya"
        className="p-2 bg-white text-zinc-800 border border-zinc-300 rounded-md hover:bg-zinc-100 disabled:opacity-40 disabled:text-zinc-400 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <ChevronRight className="h-4 w-4 stroke-[2.5]" />
      </button>
    </div>
  )
}

export function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationContent {...props} />
    </Suspense>
  )
}