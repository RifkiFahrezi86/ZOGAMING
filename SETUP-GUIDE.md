# 🎮 ZOGAMING - Panduan Setup Lengkap

---

## LANGKAH 1: Jalankan SQL Schema di Neon

1. Buka **Neon Console** → [https://console.neon.tech](https://console.neon.tech)
2. Pilih project kamu yang sudah terhubung ke Vercel
3. Klik menu **SQL Editor** di sidebar kiri
4. Copy-paste **SELURUH** isi file `schema.sql` ke editor
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`)
6. Pastikan tidak ada error (harusnya muncul "Query completed successfully")

> ⚠️ **PENTING**: Langkah ini HARUS dilakukan pertama sebelum yang lain!

---

## LANGKAH 2: Tambahkan Environment Variables di Vercel

### Apa itu Environment Variables?
Environment Variables adalah "pengaturan rahasia" yang disimpan di server Vercel. Ini dibutuhkan agar website bisa:
- Membuat token login (JWT_SECRET)
- Mengirim pesan WhatsApp otomatis (FONNTE_TOKEN)
- Mengetahui nomor WhatsApp admin (ADMIN_WHATSAPP)

### Cara Menambahkan:

1. Buka **Vercel Dashboard** → [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. Klik **nama project** kamu (STEAM SHARING)

3. Klik tab **Settings** (ikon gear ⚙️ di atas)

4. Di sidebar kiri, klik **Environment Variables**

5. Tambahkan **3 variabel** berikut satu per satu:

---

### Variabel 1: JWT_SECRET
| Field | Isi |
|-------|-----|
| **Key** | `JWT_SECRET` |
| **Value** | `zogaming-jwt-secret-key-2024-super-secure` |
| **Environment** | ✅ Production, ✅ Preview, ✅ Development |

> Ini adalah kunci rahasia untuk sistem login. Kamu boleh ganti dengan teks random yang panjang.

Klik **Save**

---

### Variabel 2: FONNTE_TOKEN
| Field | Isi |
|-------|-----|
| **Key** | `FONNTE_TOKEN` |
| **Value** | `4AZiuKjpwm1i9351WXRJ` |
| **Environment** | ✅ Production, ✅ Preview, ✅ Development |

> Ini adalah token API Fonnte untuk mengirim notifikasi WhatsApp otomatis saat ada order baru.

Klik **Save**

---

### Variabel 3: ADMIN_WHATSAPP
| Field | Isi |
|-------|-----|
| **Key** | `ADMIN_WHATSAPP` |
| **Value** | `628xxxxxxxxxx` ← **GANTI dengan nomor WhatsApp admin kamu!** |
| **Environment** | ✅ Production, ✅ Preview, ✅ Development |

> **Format nomor**: Awali dengan `62` (kode Indonesia), tanpa tanda `+`, tanpa spasi, tanpa strip.
>
> Contoh:
> - Nomor HP: `0812-3456-7890`
> - Format yang benar: `6281234567890`
> - ❌ Salah: `+6281234567890`, `081234567890`, `62 812 3456 7890`

Klik **Save**

---

### Screenshot Referensi (tampilan yang diharapkan):

```
┌─────────────────────────────────────────────────┐
│ Environment Variables                            │
├──────────────────┬──────────────────────────────┤
│ KEY              │ VALUE                         │
├──────────────────┼──────────────────────────────┤
│ DATABASE_URL     │ postgresql://... (sudah ada)  │
│ JWT_SECRET       │ zogaming-jwt-secret-key-...   │
│ FONNTE_TOKEN     │ 4AZiuKjpwm1i9351WXRJ         │
│ ADMIN_WHATSAPP   │ 6281234567890                 │
└──────────────────┴──────────────────────────────┘
```

> `DATABASE_URL` sudah otomatis ada karena Neon sudah terkoneksi ke Vercel.

---

## LANGKAH 3: Redeploy Project

Setelah menambahkan environment variables, kamu **HARUS** redeploy agar perubahan aktif:

1. Di Vercel Dashboard, klik tab **Deployments**
2. Cari deployment terakhir
3. Klik tombol **⋮** (tiga titik) di sebelah kanan
4. Pilih **Redeploy**
5. Tunggu sampai status berubah menjadi **Ready** ✅

---

## LANGKAH 4: Seed Database (Isi Data Awal)

Setelah redeploy berhasil, kita perlu mengisi database dengan data awal (produk, kategori, admin account):

### Cara 1: Lewat Browser
Buka link ini di browser (ganti `your-domain` dengan domain Vercel kamu):
```
https://zogaming.vercel.app/api/seed
```
Tambahkan ini di address bar, lalu tekan Enter. Kamu akan melihat halaman kosong/JSON. Itu normal.

> ⚠️ Tapi karena ini POST request, cara browser biasa mungkin tidak bekerja. Gunakan Cara 2.

### Cara 2: Lewat Terminal (Recommended)
Buka terminal/PowerShell dan jalankan:
```bash
curl -X POST https://your-domain.vercel.app/api/seed
```

### Cara 3: Lewat Postman / Hoppscotch
1. Buka [https://hoppscotch.io](https://hoppscotch.io) (gratis, tidak perlu install)
2. Method: **POST**
3. URL: `https://your-domain.vercel.app/api/seed`
4. Klik **Send**
5. Harusnya dapat response: `{ "message": "Database seeded successfully" }`

### Apa yang dibuat oleh Seed?
- ✅ **Admin Account**: email `admin@zogaming.com`, password `admin123`
- ✅ Semua produk game dari data JSON
- ✅ Semua kategori game
- ✅ Semua badge
- ✅ Default settings website
- ✅ Banner images

---

## LANGKAH 5: Test Login

1. Buka website kamu: `https://your-domain.vercel.app`
2. Klik tombol **Login** di header
3. Login sebagai Admin:
   - Email: `admin@zogaming.com`
   - Password: `admin123`
4. Setelah login, klik avatar → **Admin Panel**

### Test Customer:
1. Klik **Register** → buat akun baru dengan email dan nomor WhatsApp
2. Login dengan akun tersebut
3. Pilih game → klik **Buy Now** atau tambah ke cart → **Checkout**
4. Akan muncul tombol hijau besar "Chat Admin di WhatsApp"

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Login gagal / "Invalid credentials" | Pastikan sudah jalankan seed (Langkah 4) |
| Halaman kosong / error 500 | Pastikan SQL schema sudah dijalankan (Langkah 1) |
| Data tidak muncul setelah deploy | Pastikan sudah redeploy setelah tambah env vars |
| WhatsApp tidak terkirim | Cek FONNTE_TOKEN masih valid di fonnte.com |
| "DATABASE_URL not found" | Pastikan Neon sudah terhubung ke Vercel project |

---

## Struktur Halaman Baru

| URL | Fungsi | Siapa yang akses |
|-----|--------|-------------------|
| `/login` | Halaman login | Semua orang |
| `/register` | Halaman daftar akun baru | Semua orang |
| `/checkout` | Checkout & order game | Customer (harus login) |
| `/dashboard` | Lihat status pesanan | Customer (harus login) |
| `/admin/orders` | Kelola semua pesanan | Admin only |

---

> 💡 **Tips**: Setelah semua selesai, segera ganti password admin default di database!
