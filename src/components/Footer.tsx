import Link from 'next/link'
import { MapPin, Phone, Clock, Truck, ShieldCheck, CreditCard, Heart, ShoppingBag } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-zinc-900 text-zinc-300 border-t border-zinc-800 mt-auto print:hidden">
      {/* Feature Highlights Bar */}
      <div className="border-b border-zinc-800 bg-zinc-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2.5 bg-zinc-800 text-amber-400 rounded-xl">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kurir Lokal Bengkalis</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Ongkir Rp 0 - Rp 20rb (Gratis area Kota Bengkalis)</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2.5 bg-zinc-800 text-emerald-400 rounded-xl">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kualitas Terjamin</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Bahan nyaman, jahitan rapi & 100% foto asli produk</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2.5 bg-zinc-800 text-blue-400 rounded-xl">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Bayar Fleksibel</h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">Bayar di Tempat (COD), Transfer BCA, DANA, OVO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center shrink-0 border border-zinc-700">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-extrabold tracking-wider text-white">
                AEGIS COLLECTION
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Toko pakaian fashion modern terpercaya di Pulau Bengkalis. Menyediakan pakaian wanita & pria berkualitas dengan harga terjangkau.
            </p>
            <div className="pt-2 text-xs text-zinc-400 space-y-2">
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Jl. Ahmad Yani No. 88, Kel. Bengkalis Kota, Kec. Bengkalis, Pulau Bengkalis</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Buka Setiap Hari: 08.00 - 22.00 WIB (8 Pagi - 10 Malam)</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>WhatsApp: 0812-3456-7890</span>
              </p>
            </div>
          </div>

          {/* Col 2: Navigasi Cepat */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Navigasi Cepat
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Katalog Produk
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">
                  Keranjang Belanja
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Pesanan Saya
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profil & Alamat Pengiriman
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Wilayah Pengiriman Kurir */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Jangkauan Kurir Toko
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Layanan kurir lokal menjangkau seluruh desa di Pulau Bengkalis:
            </p>
            <div className="text-xs text-zinc-400 space-y-1.5 pt-1">
              <p className="font-semibold text-zinc-200">📍 Kecamatan Bengkalis:</p>
              <p className="text-[11px] text-zinc-400">Bengkalis Kota, Damon, Senggoro, Air Putih, Pedekik, Kelapapati, Sebauk, Teluk Latak, Meskom, Sekodi, dll.</p>
              <p className="font-semibold text-zinc-200 pt-1">📍 Kecamatan Bantan:</p>
              <p className="text-[11px] text-zinc-400">Selat Baru, Bantan Tua/Air, Berancah, Resam Lapis, Teluk Lancar, Jangkang, Muntai, dll.</p>
            </div>
          </div>

          {/* Col 4: Metode Pembayaran */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Metode Pembayaran
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Menerima pembayaran tunai maupun non-tunai yang aman dan fleksibel:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md">
                💵 Cash / COD
              </span>
              <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md">
                🏦 Bank BCA
              </span>
              <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md">
                📱 QRIS
              </span>
              <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md">
                📱 DANA
              </span>
              <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-md">
                📱 OVO
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-zinc-800 py-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 Aegis Collection Bengkalis. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span>untuk masyarakat Pulau Bengkalis</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

