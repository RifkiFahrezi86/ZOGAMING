// Badge Types
export type BadgeIconType = 'bolt' | 'star' | 'fire' | 'gift' | 'shield' | 'crown' | 'gem' | 'none';

export interface Badge {
  id: string;
  label: string;
  color: string;
  textColor: string;
  icon: BadgeIconType;
  active: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  salePrice: number | null;
  image: string;
  description: string;
  tags: string[];
  featured: boolean;
  trending: boolean;
  mostPlayed: boolean;
  badge: string | null;
  rating: number;
  platform: string[];
  downloads: number;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

// Banner Image Types
export interface BannerImage {
  id: string;
  title: string;
  imageUrl: string;
  badge: string | null;
  badgeColor: string;
  badgeTextColor: string;
  active: boolean;
}

// Settings Types
export interface SiteSettings {
  siteName: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  bannerImages: BannerImage[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  adminWhatsApp?: string;
  promoProductId?: string;
  promoTitle?: string;
  promoActive?: boolean;
}

// Currency helper
export function formatRupiah(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// Review Types
export interface Review {
  id: number;
  productId: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function formatDownloads(count: number): string {
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
  return count.toString();
}
