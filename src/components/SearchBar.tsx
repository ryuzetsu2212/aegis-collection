'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBarProps {
  initialQuery: string
}

export function SearchBar({ initialQuery }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()
  const pathname = usePathname()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    const category = new URLSearchParams(window.location.search).get('category')
    if (category) params.set('category', category)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari produk..."
        className="w-full px-4 py-2 pl-10 bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-800 placeholder:text-zinc-500 text-sm"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
    </form>
  )
}