'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Ruler, Footprints, GripHorizontal, RotateCcw } from 'lucide-react'

interface SizeChartModalProps {
  isOpen: boolean
  onClose: () => void
  type?: 'clothing' | 'shoe' | 'pants'
}

export function SizeChartModal({ isOpen, onClose, type = 'clothing' }: SizeChartModalProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const initialPosRef = useRef({ x: 0, y: 0 })

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    initialPosRef.current = { ...position }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (e.touches.length === 1) {
      setIsDragging(true)
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      initialPosRef.current = { ...position }
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPosition({
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy
      })
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y
      setPosition({
        x: initialPosRef.current.x + dx,
        y: initialPosRef.current.y + dy
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  if (!isOpen) return null

  const clothingSizeData = [
    { size: 'S', dada: '96 - 100', panjang: '68', bahu: '42', lengan: '22' },
    { size: 'M', dada: '100 - 104', panjang: '70', bahu: '44', lengan: '23' },
    { size: 'L', dada: '104 - 108', panjang: '72', bahu: '46', lengan: '24' },
    { size: 'XL', dada: '108 - 112', panjang: '74', bahu: '48', lengan: '25' },
    { size: 'XXL', dada: '112 - 118', panjang: '76', bahu: '50', lengan: '26' },
  ]

  const pantsSizeData = [
    { size: '28', pinggang: '72 - 74', panjang: '98', paha: '54', pinggul: '92' },
    { size: '29', pinggang: '74 - 76', panjang: '99', paha: '55', pinggul: '94' },
    { size: '30', pinggang: '76 - 78', panjang: '100', paha: '56', pinggul: '96' },
    { size: '31', pinggang: '79 - 81', panjang: '101', paha: '58', pinggul: '99' },
    { size: '32', pinggang: '82 - 84', panjang: '102', paha: '60', pinggul: '102' },
    { size: '33', pinggang: '85 - 87', panjang: '103', paha: '62', pinggul: '105' },
    { size: '34', pinggang: '88 - 90', panjang: '104', paha: '64', pinggul: '108' },
    { size: '36', pinggang: '93 - 95', panjang: '105', paha: '68', pinggul: '113' },
  ]

  const shoeSizeData = [
    { eu: '38', insole: '24.0', us: '6.0', uk: '5.0' },
    { eu: '39', insole: '24.5', us: '6.5', uk: '5.5' },
    { eu: '40', insole: '25.0', us: '7.5', uk: '6.5' },
    { eu: '41', insole: '26.0', us: '8.5', uk: '7.5' },
    { eu: '42', insole: '26.5', us: '9.0', uk: '8.0' },
    { eu: '43', insole: '27.5', us: '10.0', uk: '9.0' },
    { eu: '44', insole: '28.0', us: '10.5', uk: '9.5' },
  ]

  const isShoe = type === 'shoe'
  const isPants = type === 'pants'
  const isMoved = position.x !== 0 || position.y !== 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="bg-white w-full max-w-sm sm:max-w-md rounded-xl shadow-xl overflow-hidden border border-zinc-200 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
      >
        {/* Header - Draggable Area */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`bg-zinc-900 text-white px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between select-none cursor-grab active:cursor-grabbing ${
            isDragging ? 'cursor-grabbing' : ''
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GripHorizontal className="h-4 w-4 text-zinc-500 shrink-0" />
            {isShoe ? (
              <Footprints className="h-4 w-4 text-amber-400 shrink-0" />
            ) : (
              <Ruler className="h-4 w-4 text-amber-400 shrink-0" />
            )}
            <h3 className="font-semibold text-xs sm:text-sm tracking-wide truncate">
              {isShoe ? 'Panduan Ukuran Sepatu' : isPants ? 'Panduan Ukuran Celana' : 'Panduan Ukuran Pakaian'}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isMoved && (
              <button
                onClick={() => setPosition({ x: 0, y: 0 })}
                title="Reset Posisi"
                className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Tutup"
              className="text-zinc-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable if content is long */}
        <div className="p-3.5 sm:p-4 space-y-3 overflow-y-auto text-xs">
          <p className="text-[11px] text-zinc-500 leading-snug">
            {isShoe
              ? 'Ukur panjang telapak kaki Anda dari tumit hingga ujung jari terpanjang (dalam cm).'
              : isPants
              ? 'Ukur lingkar pinggang Anda pada titik pemakaian celana yang biasa (dalam cm).'
              : 'Gunakan tabel ukuran berikut sebagai acuan standar (dalam cm).'}
          </p>

          <div className="overflow-x-auto border border-zinc-200 rounded-lg">
            {isShoe ? (
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-100 text-zinc-900 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-1.5 px-2.5">EU</th>
                    <th className="py-1.5 px-2.5">Insole / Kaki</th>
                    <th className="py-1.5 px-2.5">US</th>
                    <th className="py-1.5 px-2.5">UK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {shoeSizeData.map((row) => (
                    <tr key={row.eu} className="hover:bg-zinc-50 font-medium">
                      <td className="py-1.5 px-2.5 font-bold text-zinc-900 bg-zinc-50/50">{row.eu}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-blue-600">{row.insole} cm</td>
                      <td className="py-1.5 px-2.5">{row.us}</td>
                      <td className="py-1.5 px-2.5">{row.uk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : isPants ? (
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-100 text-zinc-900 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-1.5 px-2.5">Ukuran</th>
                    <th className="py-1.5 px-2.5">Lingkar Pinggang</th>
                    <th className="py-1.5 px-2.5">Panjang Celana</th>
                    <th className="py-1.5 px-2.5">Lingkar Paha</th>
                    <th className="py-1.5 px-2.5">Pinggul</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {pantsSizeData.map((row) => (
                    <tr key={row.size} className="hover:bg-zinc-50 font-medium">
                      <td className="py-1.5 px-2.5 font-bold text-zinc-900 bg-zinc-50/50">{row.size}</td>
                      <td className="py-1.5 px-2.5 font-semibold text-blue-600">{row.pinggang} cm</td>
                      <td className="py-1.5 px-2.5">{row.panjang} cm</td>
                      <td className="py-1.5 px-2.5">{row.paha} cm</td>
                      <td className="py-1.5 px-2.5">{row.pinggul} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead className="bg-zinc-100 text-zinc-900 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-1.5 px-2.5">Ukuran</th>
                    <th className="py-1.5 px-2.5">Lingkar Dada</th>
                    <th className="py-1.5 px-2.5">Panjang</th>
                    <th className="py-1.5 px-2.5">Bahu</th>
                    <th className="py-1.5 px-2.5">Lengan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-zinc-700">
                  {clothingSizeData.map((row) => (
                    <tr key={row.size} className="hover:bg-zinc-50 font-medium">
                      <td className="py-1.5 px-2.5 font-bold text-zinc-900 bg-zinc-50/50">{row.size}</td>
                      <td className="py-1.5 px-2.5">{row.dada} cm</td>
                      <td className="py-1.5 px-2.5">{row.panjang} cm</td>
                      <td className="py-1.5 px-2.5">{row.bahu} cm</td>
                      <td className="py-1.5 px-2.5">{row.lengan} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-2.5 text-[11px] text-amber-800 space-y-0.5">
            <p className="font-semibold text-amber-900">💡 Tips Memilih Ukuran:</p>
            {isShoe ? (
              <>
                <p>• Kaki lebar? Disarankan +1 EU size lebih besar.</p>
                <p>• Ukur kaki saat sore hari untuk hasil paling akurat.</p>
              </>
            ) : isPants ? (
              <>
                <p>• Suka potongan lebih longgar/relaxed? Disarankan naik 1 nomor ukuran.</p>
                <p>• Toleransi jahit: ±1 - 2 cm.</p>
              </>
            ) : (
              <>
                <p>• Di antara 2 opsi ukuran? Disarankan pilih yang lebih besar.</p>
                <p>• Toleransi jahit: ±1 - 2 cm.</p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 sm:px-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <GripHorizontal className="h-3 w-3" /> Drag header untuk menggeser
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}

