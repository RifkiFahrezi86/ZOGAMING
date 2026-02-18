# ZOGAMING Backend System - Documentation

## Overview

Sistem backend lengkap untuk website ZOGAMING (LUGX Gaming) yang mencakup:
- Autentikasi customer (Login/Register)
- Sistem checkout & pembayaran (QRIS, VA, GoPay)
- Notifikasi WhatsApp otomatis
- Admin panel untuk manajemen order, customer, dan pengaturan pembayaran
- Pengiriman akun game ke customer
- Database PostgreSQL via Vercel Neon

---

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Database Configuration](#database-configuration)
3. [Environment Variables](#environment-variables)
4. [API Routes](#api-routes)
5. [Flow Pembayaran](#flow-pembayaran)
6. [Admin Panel](#admin-panel)
7. [WhatsApp Notification](#whatsapp-notification)
8. [Deployment ke Vercel](#deployment-ke-vercel)
9. [File Structure](#file-structure)
10. [Troubleshooting](#troubleshooting)

---

## 1. Setup & Installation

### Prerequisites
- Node.js 18+
- npm atau yarn
- Akun Vercel
- Akun Neon PostgreSQL (free tier available)
- Akun Fonnte.com (untuk WhatsApp API)

### Install Dependencies

```bash
npm install
```

Dependencies utama yang digunakan:
- `prisma` & `@prisma/client` - ORM untuk PostgreSQL
- `bcryptjs` - Hashing password
- `jsonwebtoken` - JWT authentication
- `next` - Framework React

### Generate Prisma Client

```bash
npx prisma generate
```

### Push Schema ke Database

```bash
npx prisma db push
```

---

## 2. Database Configuration

### Neon PostgreSQL Setup

1. Buka [neon.tech](https://neon.tech) dan buat akun gratis
2. Buat project baru
3. Copy connection string (format: `postgresql://user:password@host/database?sslmode=require`)
4. Paste ke `.env` sebagai `DATABASE_URL`

### Schema Models

| Model | Deskripsi |
|-------|-----------|
| **Customer** | Data customer (nama, email, password, phone) |
| **Order** | Data pesanan (produk, harga, status, payment, akun) |
| **PaymentSetting** | Konfigurasi metode pembayaran (QRIS/VA/GoPay) |
| **SiteConfig** | Konfigurasi umum website (key-value) |

### Enums

- **OrderStatus**: `PENDING` → `PROCESSING` → `COMPLETED` / `CANCELLED`
- **PaymentMethod**: `QRIS`, `VA`, `GOPAY`
- **PaymentStatus**: `WAITING` → `PENDING` → `SUCCESS` / `FAILED` / `EXPIRED`

---

## 3. Environment Variables

Buat file `.env` di root project:

```env
# Database - Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"

# JWT Secret (ganti dengan random string yang panjang)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# WhatsApp API - Fonnte.com
FONNTE_API_TOKEN="your-fonnte-api-token"
ADMIN_WHATSAPP="6285954092060"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **PENTING**: Untuk production di Vercel, set semua environment variables di Vercel Dashboard → Settings → Environment Variables.

---

## 4. API Routes

### Authentication

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/auth/register` | Register customer baru |
| POST | `/api/auth/login` | Login (customer & admin) |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/logout` | Logout (clear cookie) |

**Admin Credentials:**
- Email: `admin@zogaming.com`
- Password: `admin123`

> ⚠️ Ganti password admin di file `src/lib/auth.ts` untuk production!

### Checkout & Payment

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/checkout` | Buat order baru |
| GET | `/api/payments?orderId=xxx` | Get payment info + methods |
| POST | `/api/payments` | Submit pembayaran |

### Orders

| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/orders` | List semua orders (admin) |
| GET | `/api/orders/[id]` | Detail single order |
| PATCH | `/api/orders` | Update order (verify, deliver, dll) |

**PATCH Actions:**
- `verify_payment` - Verifikasi pembayaran customer
- `input_account` - Input email/password akun game
- `deliver` - Kirim akun ke customer (via WA/email)
- `cancel` - Batalkan order
- `refund` - Refund order

### Admin APIs

| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/customers` | List semua customers |
| GET | `/api/payment-settings` | Get pengaturan pembayaran |
| PUT | `/api/payment-settings` | Update pengaturan pembayaran |

### Cron

| Method | Route | Deskripsi |
|--------|-------|-----------|
| GET | `/api/cron/check-expired` | Check & cancel expired orders |

---

## 5. Flow Pembayaran

### Customer Flow

```
1. Customer browse produk → Klik "Buy Now"
2. Halaman Checkout → Isi nama, email, WhatsApp
3. Order dibuat (status: PENDING, expiry: 30 menit)
4. Halaman Payment → Pilih metode (QRIS/VA/GoPay)
5. Customer bayar → Klik "Konfirmasi Pembayaran"
6. Status: PROCESSING → Menunggu verifikasi admin
7. Admin verifikasi → Status: COMPLETED (jika akun sudah diisi)
8. Admin input akun game → Kirim ke customer via WA/email
9. Customer terima akun di halaman Order Status
```

### Timer & Expiry

- Setiap order punya **batas waktu 30 menit** untuk melakukan pembayaran
- Countdown timer ditampilkan di halaman payment
- Jika expired → Status otomatis menjadi `CANCELLED`
- Cron job berjalan setiap **5 menit** untuk check expired orders
- Customer yang expired akan dikirim notifikasi WhatsApp

### Status Flow Diagram

```
PENDING ──→ PROCESSING ──→ COMPLETED
   │              │
   │              └──→ CANCELLED (refund)
   │
   └──→ CANCELLED (expired / manual)
```

---

## 6. Admin Panel

### Akses Admin

1. Buka `/admin` atau login via `/auth/login`
2. Gunakan credentials admin (default: `admin@zogaming.com` / `admin123`)

### Menu Admin

| Menu | Path | Fungsi |
|------|------|--------|
| Dashboard | `/admin` | Overview statistics |
| Order Management | `/admin/orders-management` | Kelola orders (verify, deliver) |
| Customers | `/admin/customers` | Lihat daftar customer |
| Payment Settings | `/admin/payment-settings` | Atur metode pembayaran |
| Products | `/admin/products` | Kelola produk |
| Categories | `/admin/categories` | Kelola kategori |
| Orders (Legacy) | `/admin/orders` | Orders lama (JSON-based) |
| Banner Videos | `/admin/banner-videos` | Kelola banner |
| Badges | `/admin/badges` | Kelola badges |
| Settings | `/admin/settings` | Pengaturan website |

### Order Management Workflow

1. **New Order masuk** → Status badge kuning "PENDING"
2. **Customer bayar** → Status badge biru "PROCESSING"
3. **Admin klik "Verify Payment"** → Payment terverifikasi
4. **Admin input akun game** → Isi email & password akun
5. **Admin klik "Deliver"** → Akun dikirim ke customer via WhatsApp
6. **Order COMPLETED** → Status badge hijau "COMPLETED"

### Payment Settings

Konfigurasi 3 metode pembayaran dari admin panel:

**QRIS:**
- Upload gambar QRIS
- Set label (nama merchant)
- Enable/disable

**Virtual Account (VA):**
- Input nama bank
- Input nomor rekening
- Input nama pemilik
- Enable/disable

**GoPay:**
- Input nomor GoPay
- Input nama pemilik
- Enable/disable

---

## 7. WhatsApp Notification

### Setup Fonnte

1. Daftar di [fonnte.com](https://fonnte.com)
2. Hubungkan WhatsApp Business / nomor WhatsApp
3. Dapatkan API token
4. Masukkan token ke `.env` sebagai `FONNTE_API_TOKEN`

### Notifikasi yang Dikirim

| Event | Penerima | Pesan |
|-------|----------|-------|
| Pembayaran berhasil | Admin (085954092060) | Info order baru masuk |
| Payment diverifikasi | Customer | "Pembayaran dikonfirmasi, sedang diproses" |
| Akun dikirim | Customer | Detail akun game (email/password) |
| Order dibatalkan | Customer | Pemberitahuan pembatalan |
| Order expired | Customer | Pemberitahuan timeout + info refund |

### Format Nomor

Gunakan format internasional tanpa `+`:
- `6285954092060` ✅
- `085954092060` ❌
- `+6285954092060` ❌

---

## 8. Deployment ke Vercel

### Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit with backend system"
git branch -M main
git remote add origin https://github.com/username/zogaming.git
git push -u origin main
```

### Step 2: Import di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Klik "Add New Project"
3. Import dari GitHub repository
4. Framework: **Next.js** (auto-detected)

### Step 3: Set Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Connection string dari Neon |
| `JWT_SECRET` | Random string (min 32 chars) |
| `FONNTE_API_TOKEN` | Token dari Fonnte.com |
| `ADMIN_WHATSAPP` | `6285954092060` |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |

### Step 4: Setup Neon Integration (Optional)

Vercel memiliki integrasi langsung dengan Neon:
1. Di Vercel Dashboard → Integrations → Neon
2. Connect → Pilih project → Auto-set DATABASE_URL

### Step 5: Deploy

```bash
git push origin main
```

Vercel akan otomatis build dan deploy.

### Step 6: Push Database Schema

Setelah deploy pertama, jalankan:

```bash
npx prisma db push
```

Atau dari Vercel CLI:
```bash
vercel env pull .env.local
npx prisma db push
```

### Cron Job

File `vercel.json` sudah dikonfigurasi untuk menjalankan cron setiap 5 menit:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expired",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

> **Note**: Vercel cron jobs tersedia di Hobby plan (1 cron) atau Pro plan (unlimited).

---

## 9. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # POST - Register
│   │   │   ├── login/route.ts       # POST - Login
│   │   │   ├── me/route.ts          # GET - Current user
│   │   │   └── logout/route.ts      # POST - Logout
│   │   ├── checkout/route.ts        # POST - Create order
│   │   ├── payments/route.ts        # GET/POST - Payment
│   │   ├── orders/
│   │   │   ├── route.ts             # GET/PATCH - Orders
│   │   │   └── [id]/route.ts        # GET - Single order
│   │   ├── customers/route.ts       # GET - Customer list
│   │   ├── payment-settings/route.ts # GET/PUT - Settings
│   │   └── cron/
│   │       └── check-expired/route.ts # GET - Cron
│   ├── auth/
│   │   ├── login/page.tsx           # Login page
│   │   └── register/page.tsx        # Register page
│   ├── checkout/page.tsx            # Checkout form
│   ├── payment/[orderId]/page.tsx   # Payment page
│   ├── order-status/[orderId]/page.tsx # Order tracking
│   └── admin/
│       ├── orders-management/page.tsx # Order management
│       ├── customers/page.tsx        # Customers list
│       └── payment-settings/page.tsx  # Payment config
├── components/
│   └── layout/
│       └── Header.tsx               # Updated with auth
├── lib/
│   ├── prisma.ts                    # Prisma client
│   ├── auth.ts                      # JWT & auth helpers
│   └── whatsapp.ts                  # WhatsApp API
├── prisma/
│   └── schema.prisma                # Database schema
├── vercel.json                      # Cron config
└── .env                             # Environment vars
```

---

## 10. Troubleshooting

### Error: "DATABASE_URL not set"
Pastikan file `.env` ada dan berisi `DATABASE_URL` yang valid.

### Error: "Prisma Client not generated"
Jalankan `npx prisma generate` setelah perubahan schema.

### Error: "JWT_SECRET not defined"
Set `JWT_SECRET` di `.env` atau Vercel Environment Variables.

### WhatsApp tidak terkirim
1. Periksa `FONNTE_API_TOKEN` valid
2. Periksa nomor format internasional (`62xxx`)
3. Periksa saldo/kuota Fonnte

### Login gagal
- Customer: pastikan sudah register terlebih dahulu
- Admin: gunakan `admin@zogaming.com` / `admin123`

### Order tidak expired otomatis
- Pastikan cron job active di Vercel
- Cek log di Vercel Dashboard → Deployments → Functions

### Build error "Cannot find module '@prisma/client'"
```bash
npx prisma generate
npm run build
```

### Reset database
```bash
npx prisma db push --force-reset
```

> ⚠️ Ini akan menghapus semua data!

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] `npm install`
- [ ] Buat database di Neon PostgreSQL
- [ ] Copy `.env.example` ke `.env` dan isi semua values
- [ ] `npx prisma generate`
- [ ] `npx prisma db push`
- [ ] `npm run dev`
- [ ] Buka `http://localhost:3000`
- [ ] Login admin: `admin@zogaming.com` / `admin123`
- [ ] Atur Payment Settings di admin panel
- [ ] Test flow: Register → Browse → Buy → Pay → Admin verify → Deliver

---

*Documentation generated for ZOGAMING Backend System v1.0*
