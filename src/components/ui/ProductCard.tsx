'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product, formatRupiah, formatDownloads } from '@/lib/types';
import { useData } from '@/lib/DataContext';
import { BadgeDisplay, StarRating } from './BadgeIcon';

interface ProductCardProps {
    product: Product;
    showCategory?: boolean;
}

export default function ProductCard({ product, showCategory = true }: ProductCardProps) {
    const { addToCart, getBadgeById } = useData();
    const displayPrice = product.salePrice || product.price;
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    const badge = getBadgeById(product.badge);
    const discountPercent = hasDiscount ? Math.round((1 - product.salePrice! / product.price) * 100) : 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product);
        const btn = e.currentTarget as HTMLButtonElement;
        btn.classList.add('scale-90');
        setTimeout(() => btn.classList.remove('scale-90'), 150);
    };

    return (
        <div className="game-card group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <Link href={`/products/${product.id}`}>
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                </Link>

                {/* Badge */}
                {badge && badge.active && (
                    <div className="absolute top-3 left-3 z-10">
                        <BadgeDisplay badge={badge} size="sm" />
                    </div>
                )}

                {/* Status indicators */}
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {product.trending && (
                        <span className="px-2 py-0.5 bg-blue-500/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                            TRENDING
                        </span>
                    )}
                    {product.mostPlayed && (
                        <span className="px-2 py-0.5 bg-orange-500/90 text-white text-[10px] font-bold rounded-full backdrop-blur-sm">
                            HOT
                        </span>
                    )}
                </div>

                {/* Download count on image */}
                {product.downloads > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {formatDownloads(product.downloads)}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {showCategory && (
                    <span className="inline-block px-3 py-0.5 text-[10px] font-semibold text-[#ee626b] bg-pink-50 rounded-full mb-2 capitalize">
                        {product.category}
                    </span>
                )}
                <h4 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                </h4>

                {/* Rating */}
                <div className="mb-2">
                    <StarRating rating={product.rating || 0} size={13} />
                </div>

                {/* Price Section - Rupiah style like reference */}
                <div className="mb-3">
                    {hasDiscount && (
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm text-gray-400 line-through">{formatRupiah(product.price)}</span>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">-{discountPercent}%</span>
                        </div>
                    )}
                    <span className="text-lg font-bold text-gray-900">{formatRupiah(displayPrice)}</span>
                </div>

                {/* Buy Now + Cart buttons like reference image */}
                <div className="flex items-center gap-2">
                    <Link
                        href={`/checkout?productId=${product.id}`}
                        className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-[#4a7dff] text-white text-xs font-semibold rounded-full hover:bg-[#3a6ae8] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                        Buy Now
                    </Link>
                    <button
                        onClick={handleAddToCart}
                        className="h-9 px-3 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        title="Add to Cart"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                        Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
