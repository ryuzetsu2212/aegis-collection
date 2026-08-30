/**
 * Menghitung biaya ongkos kirim (ongkir) kurir lokal di Pulau Bengkalis.
 * Toko berpusat di Kota Bengkalis (Kel. Bengkalis Kota).
 * 
 * Skema Biaya Ongkir:
 * - Ambil di Toko / Direct: Rp 0
 * - Area Pusat Kota (Bengkalis Kota, Damon, Rimba Sekampung): Rp 0 (Gratis Ongkir)
 * - Ring 1 (Senggoro, Kelapapati, Wonosari, Pedekik, Air Putih, Sungai Alam): Rp 5.000
 * - Ring 2 (Sebauk, Pangkalan Batang, Penampi, Temuran, Bantan Tua, Selat Baru, Berancah, Resam Lengkon): Rp 10.000
 * - Ring 3 (Teluk Latak, Meskom, Prapat Tunggal, Bantan Air, Bantan Tengah/Timur, Jangkang, Deluk): Rp 15.000
 * - Ring 4 / Ujung Pulau (Sekodi, Ketam Putih, Kelemantan, Muntai, Pambang, Mentayan, Palkun, dll): Rp 20.000 (Maksimal)
 */
export function calculateShippingFee(purchaseType: string, kecamatan?: string, village?: string): number {
  if (purchaseType === 'direct') return 0

  const vil = (village || '').toLowerCase().trim()

  // Zone 0: Area Pusat Kota Bengkalis (Terdekat dengan Toko) -> Rp 0
  if (
    vil.includes('bengkalis kota') ||
    vil.includes('damon') ||
    vil.includes('rimba sekampung')
  ) {
    return 0
  }

  // Zone 1: Ring 1 Kecamatan Bengkalis (Sekitar Kota) -> Rp 5.000
  if (
    vil.includes('senggoro') ||
    vil.includes('kelapapati') ||
    vil.includes('wonosari') ||
    vil.includes('pedekik') ||
    vil.includes('air putih') ||
    vil.includes('sungai alam')
  ) {
    return 5000
  }

  // Zone 2: Ring 2 Kecamatan Bengkalis & Bantan Dekat -> Rp 10.000
  if (
    vil.includes('sebauk') ||
    vil.includes('pangkalan batang') ||
    vil.includes('penampi') ||
    vil.includes('temuran') ||
    vil.includes('bantan tua') ||
    vil.includes('selat baru') ||
    vil.includes('berancah') ||
    vil.includes('resam lapis')
  ) {
    return 10000
  }

  // Zone 3: Ring 3 Pesisir & Bantan Tengah -> Rp 15.000
  if (
    vil.includes('teluk latak') ||
    vil.includes('meskom') ||
    vil.includes('prapat tunggal') ||
    vil.includes('bantan air') ||
    vil.includes('bantan tengah') ||
    vil.includes('bantan timur') ||
    vil.includes('jangkang') ||
    vil.includes('deluk') ||
    vil.includes('teluk papal') ||
    vil.includes('teluk lancar')
  ) {
    return 15000
  }

  // Zone 4: Ujung Pulau Bengkalis & Bantan Jauh -> Rp 20.000 (Maksimal)
  return 20000
}

