'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Category {
  id: number
  name: string
  slug: string
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value
    const params = new URLSearchParams(window.location.search)
    if (slug) params.set('category', slug)
    else params.delete('category')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={selectedCategory}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-800 bg-white text-zinc-900 text-sm"
    >
      <option value="" className="text-zinc-900 bg-white">Semua Kategori</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.slug} className="text-zinc-900 bg-white">
          {cat.name}
        </option>
      ))}
    </select>
  )
}