'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Filter, ArrowUpDown } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

interface AdvancedFilterProps {
  categories: Category[]
}

export function AdvancedFilter({ categories }: AdvancedFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') || ''
  const currentSort = searchParams.get('sort') || 'newest'
  const currentMinPrice = searchParams.get('min_price') || ''
  const currentMaxPrice = searchParams.get('max_price') || ''

  const [minPrice, setMinPrice] = useState(currentMinPrice)
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice)
  const [isOpen, setIsOpen] = useState(false)

  const updateFilters = (paramsToUpdate: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(paramsToUpdate).forEach(([key, val]) => {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    })
    params.set('page', '1')
    router.push(`/?${params.toString()}`)
  }

  const handleApplyPrice = () => {
    updateFilters({
      min_price: minPrice ? minPrice : null,
      max_price: maxPrice ? maxPrice : null,
    })
  }

  const handleReset = () => {
    setMinPrice('')
    setMaxPrice('')
    router.push('/')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Category Selector */}
        <select
          value={currentCategory}
          onChange={(e) => updateFilters({ category: e.target.value || null })}
          className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer shadow-xs"
        >
          <option value="">Semua Kategori</option>
          {(Array.isArray(categories) ? categories : []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Sort Selector */}
        <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3.5 py-2 shadow-xs">
          <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
          <select
            value={currentSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga: Terendah ke Tinggi</option>
            <option value="price_desc">Harga: Tertinggi ke Rendah</option>
          </select>
        </div>

        {/* Toggle Price Filter Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
            isOpen || currentMinPrice || currentMaxPrice
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter Harga</span>
        </button>

        {(currentCategory || currentMinPrice || currentMaxPrice || currentSort !== 'newest') && (
          <button
            onClick={handleReset}
            className="text-xs text-red-600 font-semibold hover:underline cursor-pointer ml-auto"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Filter Rentang Harga Panel */}
      {isOpen && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">Harga Min (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/\D/g, ''))}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-900 w-32 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-1">Harga Max (Rp)</label>
            <input
              type="number"
              placeholder="1000000"
              value={maxPrice}
            />
          </div>
          <button
            onClick={handleApplyPrice}
            className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      )}
    </div>
  )
}

