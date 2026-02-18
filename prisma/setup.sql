-- ==========================================
-- ZOGAMING Database Setup SQL
-- For Neon PostgreSQL (steam-sharing)
-- ==========================================

-- Create enums
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('QRIS', 'VA', 'GOPAY');
CREATE TYPE "PaymentStatus" AS ENUM ('WAITING', 'PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');

-- Create customers table
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- Create orders table
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productPrice" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "total" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'WAITING',
    "paymentExpiry" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "accountEmail" TEXT,
    "accountPassword" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveryMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Create payment_settings table
CREATE TABLE "payment_settings" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "qrisImage" TEXT,
    "bankName" TEXT,
    "vaNumber" TEXT,
    "accountName" TEXT,
    "gopayNumber" TEXT,
    "gopayName" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- Create site_config table
CREATE TABLE "site_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE UNIQUE INDEX "payment_settings_method_key" ON "payment_settings"("method");
CREATE UNIQUE INDEX "site_config_key_key" ON "site_config"("key");

-- Add foreign key
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ==========================================
-- Insert default payment settings
-- ==========================================
INSERT INTO "payment_settings" ("id", "method", "label", "enabled", "instructions", "createdAt", "updatedAt") VALUES
('ps_qris', 'QRIS', 'QRIS', true, 'Scan QR code untuk membayar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ps_va', 'VA', 'Virtual Account', true, 'Transfer ke Virtual Account berikut', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ps_gopay', 'GOPAY', 'GoPay', true, 'Transfer ke nomor GoPay berikut', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
