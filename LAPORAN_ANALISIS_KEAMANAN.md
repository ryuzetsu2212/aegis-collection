# 🛡️ Laporan Analisis Keamanan Sistem (Security Analysis Report)
**Aplikasi:** Toko Pakaian E-Commerce  
**Tanggal Analisis:** 28 Agustus 2026  
**Status Audit:** Selesai (Completed)  

---

## 1. Ringkasan Eksekutif (Executive Summary)

Laporan ini menyajikan hasil analisis dan pengujian keamanan pada aplikasi **Toko Pakaian E-Commerce** berbasis **Next.js 16**, **TypeScript**, **Tailwind CSS**, dan **SQLite (better-sqlite3)**. Evaluasi keamanan mencakup aspek Autentikasi & Otorisasi (RBAC), Keamanan Basis Data, Penanganan Sesi & JWT, Keamanan Upload File, Validasi Input (XSS & Injection), serta Pengaturan Header Keamanan.

---

## 2. Metodologi Audit Keamanan

Analisis dilakukan berdasarkan kerangka kerja **OWASP Top 10 Web Application Security Risks**:
1. **Static Application Security Testing (SAST)**: Pengujian dan pengawasan kode sumber (*source code analysis*).
2. **Review Arsitektur & Autentikasi**: Evaluasi alur autentikasi JWT, penanganan cookie, serta middleware RBAC.
3. **Analisis Konfigurasi Lingkungan**: Evaluasi penggunaan variabel lingkungan (`.env`) dan perlindungan secret keys.

---

## 3. Temuan Keamanan Utama (Security Findings & Risk Assessment)

### 🔴 High Risk (Risiko Tinggi)

#### 1. Insecure Fallback JWT Secret Key
* **Lokasi Kode:** [src/lib/jwt.ts](file:///d:/Project%20Website/toko-pakaian/src/lib/jwt.ts#L12-L14)
* **Deskripsi:** Jika variabel lingkungan `JWT_SECRET` tidak diset, sistem menggunakan fallback default `'INSECURE-FALLBACK-DO-NOT-USE-IN-PRODUCTION'`.
* **Dampak:** Penyerang dapat membuat token JWT palsu dengan peran `admin` atau `staff` dan memalsukan identitas pengguna lain.
* **Rekomendasi:** Wajibkan sistem untuk melempar error saat *startup* jika `JWT_SECRET` tidak terdefinisi pada lingkungan produksi, dan hindari pemakaian nilai default fallback yang dapat ditebak.

#### 2. Kurangnya Enforce Authorization / Privilege Check di Endpoint API
* **Lokasi Kode:** `src/app/api/...`
* **Deskripsi:** Middleware Next.js melindungi rute halaman frontend (`/admin`, `/staff`), namun beberapa rute API internal perlu memastikan pengecekan peran (*role check*) secara langsung di handler API.
* **Dampak:** Risiko BOLA/IDOR (Broken Object Level Authorization) atau Broken Function Level Authorization di mana pengguna biasa memanggil endpoint API admin/staff.
* **Rekomendasi:** Terapkan verifikasi token dan validasi `user.role === 'admin'` / `'staff'` pada setiap handler API sensitif (DELETE/PUT/POST produk, pengguna, pesanan, voucher).

---

### 🟡 Medium Risk (Risiko Sedang)

#### 3. Keamanan Upload File (File Upload Vulnerabilities)
* **Lokasi Kode:** `src/app/api/upload/route.ts`
* **Deskripsi:** Endpoint upload gambar produk/banner perlu validasi ketat terhadap tipe berkas (MIME type & extension), pembatasan ukuran file (max 2MB-5MB), dan generasi nama file acak untuk mencegah overwrite.
* **Dampak:** Pengunggahan berkas berbahaya (webshell/malicious scripts) atau pembengkakan ruang penyimpanan (DoS storage).
* **Rekomendasi:** 
  - Validasi *Magic Bytes* (header file), bukan hanya ekstensi.
  - Simpan berkas di luar direktori eksekusi publik atau gunakan Object Storage terisolasi dengan akses read-only.

#### 4. Rate Limiting pada Endpoint Sensitif (Auth & OTP)
* **Lokasi Kode:** [src/app/api/auth/login/route.ts](file:///d:/Project%20Website/toko-pakaian/src/app/api/auth/login/route.ts), `src/app/api/auth/send-otp/route.ts`
* **Deskripsi:** Perlunya penerapan pembatas laju percobaan (rate limiting) pada rute login dan pengiriman OTP.
* **Dampak:** Kerentanan terhadap serangan Brute Force password dan pemboman OTP (OTP flooding/SMS/Email cost exhaustion).
* **Rekomendasi:** Integrasikan modul `src/lib/rate-limit.ts` (IP-based / User-based sliding window) pada semua endpoint autentikasi.

---

### 🟢 Low Risk & Best Practices (Risiko Rendah & Praktik Terbaik)

#### 5. Pengaturan HTTP Security Headers
* **Lokasi Kode:** `next.config.js` / `next.config.ts`
* **Deskripsi:** Belum terkonfigurasinya HTTP Security Headers secara eksplisit pada respon aplikasi.
* **Rekomendasi:** Tambahkan header keamanan standar pada Next.js config:
  - `Content-Security-Policy (CSP)`
  - `X-Frame-Options: DENY` (Mencegah Clickjacking)
  - `X-Content-Type-Options: nosniff` (Mencegah MIME sniffing)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`

#### 6. Parameterized Queries pada SQLite
* **Status:** **TERLINDUNGI (SECURE)**
* **Keterangan:** Penggunaan library `better-sqlite3` dengan perintah `db.prepare()` sudah menerapkan *prepared statements* secara konsisten, sehingga aplikasi aman dari kerentanan SQL Injection mendasar.

#### 7. Hashing Kata Sandi (Password Hashing)
* **Status:** **TERLINDUNGI (SECURE)**
* **Keterangan:** Menggunakan algoritma `bcryptjs` untuk meng-hash kata sandi pengguna sebelum disimpan ke database.

---

## 4. Matriks Evaluasi Keamanan (Security Matrix)

| Komponen | Status Keamanan | Keterangan |
| :--- | :--- | :--- |
| **SQL Injection** | 🟢 Aman | Memakai Prepared Statements (`better-sqlite3`) |
| **Password Hashing** | 🟢 Aman | Menggunakan `bcryptjs` |
| **JWT Implementation** | 🟡 Perlu Perbaikan | Hilangkan fallback hardcoded secret key |
| **RBAC / Middleware** | 🟡 Perlu Perbaikan | Tambahkan API-level authorization check |
| **Upload Security** | 🟡 Perlu Perbaikan | Pembatasan MIME type & ukuran file |
| **Rate Limiting** | 🟡 Perlu Perbaikan | Pasang pembatas laju pada endpoint auth/OTP |
| **HTTP Security Headers** | 🟡 Perlu Tambahan | Konfigurasi CSP, X-Frame-Options, HSTS |

---

## 5. Rencana Tindak Lanjut & Rekomendasi (Action Plan)

1. **Prioritas 1 (Segera):**
   - Hapus fallback `INSECURE-FALLBACK-DO-NOT-USE-IN-PRODUCTION` di `src/lib/jwt.ts`.
   - Tambahkan pengecekan peran pengguna di seluruh handler API (`/api/admin/*`, `/api/staff/*`).

2. **Prioritas 2 (Jangka Pendek):**
   - Terapkan rate-limiting pada endpoint `/api/auth/login` dan `/api/auth/send-otp`.
   - Konfigurasi HTTP Security Headers di `next.config.js`.

3. **Prioritas 3 (Pemeliharaan):**
   - Lakukan pembaruan rutin pada dependensi npm untuk mencegah kerentanan modul (*vulnerable dependencies*).

---
*Laporan ini dibuat secara otomatis dan disimpan dalam direktori proyek sebagai acuan keamanan aplikasi.*

