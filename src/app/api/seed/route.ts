import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/security';
import { getAuthUser } from '@/lib/auth';
import { randomBytes } from 'crypto';
import productsData from '@/data/products.json';
import categoriesData from '@/data/categories.json';
import badgesData from '@/data/badges.json';

export async function POST(request: Request) {
  try {
    // SECURITY: Require admin authentication for seed
    const user = await getAuthUser();
    if (user && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: hanya admin yang dapat menjalankan seed' }, { status: 403 });
    }
    // Allow unauthenticated only if no admin user exists yet (first-time setup)
    // AND a valid SEED_SECRET is provided
    if (!user) {
      const sql = getDb();
      const existingAdmins = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
      if (existingAdmins.length > 0) {
        return NextResponse.json({ error: 'Unauthorized: login sebagai admin untuk menjalankan seed' }, { status: 401 });
      }
      // For first-time setup, require SEED_SECRET if set in env
      const seedSecret = process.env.SEED_SECRET;
      if (seedSecret) {
        const body = await request.clone().json().catch(() => ({}));
        const providedSecret = request.headers.get('x-seed-secret') || body.seedSecret;
        if (providedSecret !== seedSecret) {
          return NextResponse.json({ error: 'Invalid seed secret' }, { status: 403 });
        }
      }
    }

    // Rate limiting - very strict for seed
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`seed:${ip}`, RATE_LIMITS.seed);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Seed dibatasi. Coba lagi nanti.' }, { status: 429 });
    }

    const sql = getDb();

    // 1. Create admin user with cryptographically random password
    const adminPassword = randomBytes(12).toString('base64url').slice(0, 16);
    const adminHash = await bcrypt.hash(adminPassword, 12);
    await sql`
      INSERT INTO users (name, email, password_hash, phone, role)
      VALUES ('Admin', 'admin@zogaming.com', ${adminHash}, '', 'admin')
      ON CONFLICT (email) DO NOTHING
    `;
    // Store generated password to return once
    const isNewAdmin = (await sql`SELECT id FROM users WHERE email = 'admin@zogaming.com' AND password_hash = ${adminHash}`).length > 0;

    // 2. Seed categories
    for (const cat of categoriesData) {
      await sql`
        INSERT INTO categories (id, name, slug, image, description)
        VALUES (${cat.id}, ${cat.name}, ${cat.slug}, ${cat.image}, ${cat.description || ''})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 3. Seed badges
    for (const badge of badgesData as Array<{ id: string; label: string; color: string; textColor: string; icon: string; active: boolean }>) {
      await sql`
        INSERT INTO badges (id, label, color, text_color, icon, active)
        VALUES (${badge.id}, ${badge.label}, ${badge.color}, ${badge.textColor}, ${badge.icon}, ${badge.active})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 4. Seed products
    for (const prod of productsData as Array<{ id: string; name: string; slug: string; category: string; price: number; salePrice: number | null; image: string; description: string; tags: string[]; featured: boolean; trending: boolean; mostPlayed: boolean; badge: string | null; rating: number; platform: string[]; downloads: number }>) {
      await sql`
        INSERT INTO products (id, name, slug, category, price, sale_price, image, description, tags, featured, trending, most_played, badge, rating, platform, downloads)
        VALUES (${prod.id}, ${prod.name}, ${prod.slug}, ${prod.category}, ${prod.price}, ${prod.salePrice}, ${prod.image}, ${prod.description}, ${prod.tags}, ${prod.featured}, ${prod.trending}, ${prod.mostPlayed}, ${prod.badge}, ${prod.rating}, ${prod.platform}, ${prod.downloads})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 5. Seed default settings
    const defaultSettings: Record<string, unknown> = {
      siteName: 'ZOGAMING',
      logo: '/images/logo.svg',
      address: 'Sunny Isles Beach, FL 33160, United States',
      phone: '+123 456 7890',
      email: 'lugx@contact.com',
      heroTitle: 'BEST GAMING SITE EVER!',
      heroSubtitle: 'Welcome to ZOGAMING',
      heroDescription: 'ZOGAMING is your ultimate destination for the best video games. Browse our collection of action, adventure, strategy, and racing games.',
      adminWhatsApp: process.env.ADMIN_WHATSAPP || '',
      socialLinks: { facebook: '#', twitter: '#', instagram: '#' },
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      await sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${JSON.stringify(value)})
        ON CONFLICT (key) DO NOTHING
      `;
    }

    // 6. Seed default banners
    const banners = [
      { id: 'bi1', title: 'TOP SELLER', imageUrl: '/images/Resident-Evil-Requiem.jpg', badge: 'best-seller', badgeColor: '#ef4444', badgeTextColor: '#ffffff', active: true },
      { id: 'bi2', title: 'BEST SELLER', imageUrl: '/images/trending-02.jpg', badge: 'best-seller', badgeColor: '#3b82f6', badgeTextColor: '#ffffff', active: true },
      { id: 'bi3', title: 'NEW RELEASE', imageUrl: '/images/trending-03.jpg', badge: 'new-release', badgeColor: '#10b981', badgeTextColor: '#ffffff', active: true },
      { id: 'bi4', title: 'PRE-ORDER NOW', imageUrl: '/images/trending-04.jpg', badge: 'pre-order', badgeColor: '#f59e0b', badgeTextColor: '#000000', active: true },
    ];

    for (let i = 0; i < banners.length; i++) {
      const b = banners[i];
      await sql`
        INSERT INTO banner_images (id, title, image_url, badge, badge_color, badge_text_color, active, sort_order)
        VALUES (${b.id}, ${b.title}, ${b.imageUrl}, ${b.badge}, ${b.badgeColor}, ${b.badgeTextColor}, ${b.active}, ${i})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 7. Create admins table & add assigned_admin_id to orders
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        whatsapp VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_admin_id INTEGER`;

    // 8. Seed default admin with WhatsApp number from env
    const adminWhatsApp = process.env.ADMIN_WHATSAPP || '6285954092060';
    await sql`
      INSERT INTO admins (name, whatsapp, active, sort_order)
      SELECT 'Admin 1', ${adminWhatsApp}, true, 0
      WHERE NOT EXISTS (SELECT 1 FROM admins LIMIT 1)
    `;

    // 9. Create reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(product_id, user_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`;

    const responseData: Record<string, unknown> = { 
      message: 'Database seeded successfully!',
    };
    // Only show generated password once for new admin
    if (isNewAdmin) {
      responseData.adminCredentials = {
        email: 'admin@zogaming.com',
        password: adminPassword,
        warning: 'SIMPAN PASSWORD INI! Tidak akan ditampilkan lagi. Segera ubah setelah login.',
      };
    } else {
      responseData.info = 'Admin sudah ada, password tidak diubah.';
    }
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed gagal. Periksa konfigurasi database.' }, { status: 500 });
  }
}
