# ZOGAMING - Platform Jual Beli Akun Game

## 🎮 Tentang ZOGAMING

ZOGAMING adalah platform e-commerce untuk jual beli akun game yang dibangun dengan **Next.js 16**, **Prisma 7**, **Neon PostgreSQL**, dan di-deploy di **Vercel**. Website ini memiliki fitur lengkap mulai dari tampilan produk, checkout, pembayaran, hingga admin panel.

---

## 🛠️ Tech Stack

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Next.js | 16.1.6 | Framework React (App Router) |
| React | 19.2.3 | UI Library |
| Tailwind CSS | 4 | Styling |
| Prisma | 7.4.0 | ORM Database |
| PostgreSQL (Neon) | - | Database |
| bcryptjs | 3.0.3 | Password hashing |
| jsonwebtoken | 9.0.3 | JWT Authentication |
| Fonnte API | - | WhatsApp notification |
| Vercel | - | Hosting & Deployment |

---

## 📁 Struktur Project

```
zogaming/
├── prisma/
│   ├── schema.prisma          # Prisma schema (models, enums)
│   └── setup.sql              # SQL untuk setup database manual
├── public/images/             # Gambar statis (logo, banner, produk)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── globals.css        # Global styles + Tailwind
│   │   ├── admin/             # Admin panel (auth-protected)
│   │   │   ├── layout.tsx     # Admin layout + sidebar + auth gate
│   │   │   ├── page.tsx       # Dashboard (stats dari DB)
│   │   │   ├── orders-management/ # Kelola pesanan dari database
│   │   │   ├── customers/     # Daftar customer
│   │   │   ├── payment-settings/  # Konfigurasi QRIS/VA/GoPay
│   │   │   ├── products/      # Kelola produk
│   │   │   ├── categories/    # Kelola kategori
│   │   │   ├── badges/        # Kelola badge produk
│   │   │   ├── banner-videos/ # Kelola banner
│   │   │   └── settings/      # Pengaturan website
│   │   ├── auth/
│   │   │   ├── login/         # Halaman login
│   │   │   └── register/      # Halaman registrasi
│   │   ├── shop/              # Halaman shop (semua produk)
│   │   ├── products/[id]/     # Detail produk
│   │   ├── checkout/          # Halaman checkout
│   │   ├── payment/[orderId]/ # Halaman pembayaran
│   │   ├── order-status/[orderId]/ # Status pesanan
│   │   ├── contact/           # Halaman kontak
│   │   └── api/               # API Routes
│   │       ├── auth/login/    # POST - Login
│   │       ├── auth/register/ # POST - Register
│   │       ├── auth/me/       # GET - Current user
│   │       ├── auth/logout/   # POST - Logout
│   │       ├── checkout/      # POST - Buat order baru
│   │       ├── orders/        # GET/PATCH - Kelola orders
│   │       ├── orders/[id]/   # GET - Detail order
│   │       ├── payments/      # GET/POST - Pembayaran
│   │       ├── payment-settings/ # GET/PUT - Setting pembayaran
│   │       ├── customers/     # GET - Daftar customer
│   │       ├── health/        # GET/POST - DB health check & auto-setup
│   │       └── cron/check-expired/ # GET - Auto-expire pesanan
│   ├── components/
│   │   ├── layout/Header.tsx  # Header + navbar + cart + auth
│   │   ├── layout/Footer.tsx  # Footer
│   │   └── ui/               # Komponen UI reusable
│   ├── data/                  # Data JSON (produk, kategori, dll)
│   └── lib/
│       ├── prisma.ts          # Prisma client (Neon adapter)
│       ├── auth.ts            # JWT + bcrypt helpers
│       ├── types.ts           # TypeScript types
│       ├── whatsapp.ts        # Fonnte WhatsApp API
│       └── DataContext.tsx     # React context (produk, cart)
├── .env                       # Environment variables (JANGAN commit!)
├── .env.example               # Template env variables
├── package.json
└── vercel.json                # Vercel config (opsional)
```

---

## 🚀 Setup & Deployment

### 1. Clone Repository

```bash
git clone https://github.com/RifkiFahrezi86/zogaming.git
cd zogaming
npm install
```

### 2. Setup Database (Neon)

**Cara 1: Otomatis via API** (Recommended)
```
Setelah deploy ke Vercel dan DATABASE_URL sudah di-set:
1. Buka: https://your-domain.vercel.app/api/health
   → Cek status koneksi database
2. Kirim POST request:
   curl -X POST https://your-domain.vercel.app/api/health
   → Otomatis membuat semua tabel dan data default
```

**Cara 2: Manual via Neon SQL Editor**
```
1. Buka https://console.neon.tech
2. Pilih project "steam-sharing"
3. Klik "SQL Editor"
4. Copy-paste isi file prisma/setup.sql
5. Klik "Run"
```

**Cara 3: Via Prisma CLI**
```bash
# Set DATABASE_URL di .env terlebih dahulu
npx prisma db push
```

### 3. Environment Variables

Copy `.env.example` ke `.env` dan isi:

```env
DATABASE_URL="postgresql://neondb_owner:xxxxx@ep-xxxxx.neon.tech/neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:xxxxx@ep-xxxxx.neon.tech/neondb?sslmode=require"
JWT_SECRET="random-secret-key-yang-panjang"
FONNTE_API_TOKEN="token-dari-fonnte.com"
ADMIN_WHATSAPP="6285954092060"
NEXT_PUBLIC_APP_URL="https://zogaming.vercel.app"
```

> **Ambil DATABASE_URL dari:**
> Vercel Dashboard → Storage → steam-sharing → Tab `.env.local` → Copy semua

### 4. Deploy ke Vercel

```bash
# Login Vercel (pertama kali)
npx vercel login

# Deploy
npx vercel --prod
```

Atau push ke GitHub dan Vercel auto-deploy:
```bash
git add -A
git commit -m "update"
git push origin main
```

### 5. Setup Database Setelah Deploy

```bash
# Buka browser:
https://zogaming.vercel.app/api/health

# Jika response "tables_missing", kirim POST:
curl -X POST https://zogaming.vercel.app/api/health
# atau buka Postman → POST → https://zogaming.vercel.app/api/health
```

---

## 👤 Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@zogaming.com | admin123 |
| Customer | *(registrasi sendiri)* | *(min 6 karakter)* |

---

## 🔧 Fitur Lengkap

### Customer
- ✅ Registrasi & Login (JWT + Cookie)
- ✅ Browse produk (filter kategori, pagination)
- ✅ Detail produk (deskripsi, rating, badge, platform)
- ✅ Add to Cart & Checkout
- ✅ Pilih metode pembayaran (QRIS / VA / GoPay)
- ✅ Countdown timer 30 menit untuk bayar
- ✅ Konfirmasi pembayaran
- ✅ Cek status pesanan (real-time auto-refresh)
- ✅ Terima akun game setelah admin proses
- ✅ Notifikasi WhatsApp (via Fonnte)

### Admin
- ✅ Login admin (email: admin@zogaming.com)
- ✅ Dashboard dengan statistik dari database
- ✅ Kelola orders (verify payment → input akun → deliver)
- ✅ Kelola customer
- ✅ Konfigurasi pembayaran (QRIS image, VA, GoPay)
- ✅ Kelola produk, kategori, badge, banner
- ✅ Site settings
- ✅ Protected route (hanya admin yang bisa akses)

### Sistem
- ✅ Dark theme glassmorphism (checkout, payment, order-status)
- ✅ Responsive mobile + desktop
- ✅ Auto-expire pesanan yang belum dibayar
- ✅ WhatsApp notification ke admin & customer
- ✅ Database health check API (`/api/health`)
- ✅ Auto-setup database via API (`POST /api/health`)

---

## 📱 Alur Pembelian

```
Customer                           Admin
   │                                 │
   ├── Browse Shop ──────────────────┤
   ├── Pilih Produk ─────────────────┤
   ├── Klik "Add to Cart" ──────────┤
   ├── Klik "Checkout" di Cart ──────┤
   ├── Isi form (nama, email, WA) ──┤
   ├── Submit → Order dibuat ────────┤
   ├── Pilih metode pembayaran ──────┤
   ├── Bayar (QRIS/VA/GoPay) ───────┤
   ├── "Saya Sudah Bayar" ──────────┤
   │                                 ├── Verifikasi pembayaran
   │                                 ├── Input email + password akun
   │                                 ├── "Deliver" → kirim ke customer
   ├── Terima akun di halaman status ┤
   ├── Notifikasi WhatsApp ──────────┤
   └─────────────────────────────────┘
```

---

## 🔌 API Routes

| Method | Route | Auth | Deskripsi |
|--------|-------|------|-----------|
| POST | `/api/auth/register` | - | Registrasi customer baru |
| POST | `/api/auth/login` | - | Login (admin/customer) |
| GET | `/api/auth/me` | Cookie | Get current user |
| POST | `/api/auth/logout` | Cookie | Logout |
| POST | `/api/checkout` | - | Buat order baru |
| GET | `/api/orders` | Admin | List semua orders |
| PATCH | `/api/orders` | Admin | Update order (verify, deliver, cancel) |
| GET | `/api/orders/[id]` | - | Detail satu order |
| GET | `/api/payments?orderId=` | - | Data pembayaran & metode |
| POST | `/api/payments` | - | Pilih metode / konfirmasi bayar |
| GET | `/api/payment-settings` | - | Get payment settings |
| PUT | `/api/payment-settings` | Admin | Update payment settings |
| GET | `/api/customers` | Admin | List customers |
| GET | `/api/health` | - | Cek status database |
| POST | `/api/health` | - | Auto-setup tabel database |
| GET | `/api/cron/check-expired` | - | Auto-expire pesanan |

---

## 🗄️ Database Schema

### Tabel: `customers`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | TEXT (CUID) | Primary key |
| name | TEXT | Nama lengkap |
| email | TEXT (UNIQUE) | Email |
| password | TEXT | Hashed (bcrypt) |
| phone | TEXT? | Nomor WhatsApp |
| createdAt | TIMESTAMP | Auto |
| updatedAt | TIMESTAMP | Auto |

### Tabel: `orders`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | TEXT (CUID) | Primary key |
| orderNumber | TEXT (UNIQUE) | Format: ORD-001 |
| customerId | TEXT (FK) | → customers.id |
| customerName | TEXT | Nama pembeli |
| customerEmail | TEXT | Email pembeli |
| customerPhone | TEXT | WhatsApp pembeli |
| productId | TEXT | ID produk |
| productName | TEXT | Nama produk |
| productPrice | INT | Harga satuan |
| quantity | INT | Jumlah |
| total | INT | Total bayar |
| status | ENUM | PENDING/PROCESSING/COMPLETED/CANCELLED |
| paymentMethod | ENUM? | QRIS/VA/GOPAY |
| paymentStatus | ENUM | WAITING/PENDING/SUCCESS/FAILED/EXPIRED |
| paymentExpiry | TIMESTAMP? | Batas waktu bayar (30 menit) |
| paidAt | TIMESTAMP? | Waktu dibayar |
| accountEmail | TEXT? | Email akun game |
| accountPassword | TEXT? | Password akun game |
| deliveredAt | TIMESTAMP? | Waktu dikirim |

### Tabel: `payment_settings`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | TEXT | Primary key |
| method | TEXT (UNIQUE) | qris/va/gopay |
| label | TEXT | Label tampilan |
| enabled | BOOLEAN | Aktif / tidak |
| qrisImage | TEXT? | URL gambar QRIS |
| bankName | TEXT? | Nama bank (VA) |
| vaNumber | TEXT? | Nomor VA |
| gopayNumber | TEXT? | Nomor GoPay |

---

## 🔄 Vercel Cron Job (Opsional)

Untuk auto-expire pesanan yang belum dibayar, tambahkan di `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/check-expired",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 🐛 Troubleshooting

### "Terjadi kesalahan server" saat Register/Login
1. Cek database connection: `GET /api/health`
2. Jika `tables_missing`: `POST /api/health` untuk auto-create
3. Jika `error`: Periksa `DATABASE_URL` di Vercel env variables

### Website blank / error 500
1. Pastikan semua env variables sudah di-set di Vercel
2. Cek Vercel deployment logs di dashboard

### Admin panel tidak bisa diakses
1. Login dulu di `/auth/login` dengan admin@zogaming.com / admin123
2. Admin panel di `/admin` hanya bisa diakses admin

### WhatsApp tidak terkirim
1. Daftar di https://fonnte.com
2. Set `FONNTE_API_TOKEN` di environment variables
3. Tanpa token, notifikasi hanya di-log di console (tidak error)

---

## 📝 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Push schema ke database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

---

## � CLI Deploy Scripts

### Quick Push (tanpa build test)
```powershell
# PowerShell
.\push.ps1 -m "pesan commit"
```

### Full Deploy (build + push)
```powershell
# PowerShell
.\deploy.ps1 -m "pesan commit"

# Atau via npm
npm run deploy
```

### Windows Batch
```cmd
deploy.bat "pesan commit"
```

### Manual Push
```bash
git add -A
git commit -m "pesan commit"
git push origin main
```

> **Note:** Vercel otomatis deploy setiap kali push ke branch `main` di GitHub.

---

## �📜 License

Private project - ZOGAMING © 2026
