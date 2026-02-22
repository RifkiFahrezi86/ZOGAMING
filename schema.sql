-- ============================================
-- ZOGAMING Database Schema
-- Run this in Neon SQL Editor
-- ============================================

-- 1. Users table (customers & admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_enc TEXT DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add password_enc column if table already exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_enc TEXT DEFAULT '';

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  image VARCHAR(500) DEFAULT '',
  description TEXT DEFAULT ''
);

-- 3. Badges table
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(50) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  color VARCHAR(20) DEFAULT '#000000',
  text_color VARCHAR(20) DEFAULT '#ffffff',
  icon VARCHAR(20) DEFAULT 'none',
  active BOOLEAN DEFAULT true
);

-- 4. Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  sale_price INTEGER,
  image VARCHAR(500) DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  trending BOOLEAN DEFAULT false,
  most_played BOOLEAN DEFAULT false,
  badge VARCHAR(50) DEFAULT NULL,
  rating INTEGER DEFAULT 5,
  platform TEXT[] DEFAULT '{}',
  downloads INTEGER DEFAULT 0
);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'cancelled')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(50),
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500) DEFAULT '',
  quantity INTEGER DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0
);

-- 7. Settings table (key-value)
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB
);

-- 8. Banner images table
CREATE TABLE IF NOT EXISTS banner_images (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) DEFAULT '',
  image_url VARCHAR(500) DEFAULT '',
  badge VARCHAR(50) DEFAULT '',
  badge_color VARCHAR(20) DEFAULT '#ef4444',
  badge_text_color VARCHAR(20) DEFAULT '#ffffff',
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- 9. Admins table (multi-admin with WhatsApp numbers)
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add assigned_admin_id to orders for round-robin routing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL;

-- 10. Reviews table (real customer reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, user_id)  -- satu user hanya bisa review sekali per produk
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_trending ON products(trending);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_most_played ON products(most_played);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(active);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
