'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import { useData } from '@/lib/DataContext';
import { BadgeDisplay, StarRating } from '@/components/ui/BadgeIcon';
import { formatRupiah, formatDownloads } from '@/lib/types';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { products, categories, addToCart, getBadgeById } = useData();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const [addedToCart, setAddedToCart] = useState(false);

    const product = products.find((p) => p.id === resolvedParams.id);
    const relatedProducts = products
        .filter((p) => p.category === product?.category && p.id !== product?.id)
        .slice(0, 4);

    if (!product) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
                        <Link href="/shop" className="btn-primary">
                            Back to Shop
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const displayPrice = product.salePrice || product.price;
    const hasDiscount = product.salePrice && product.salePrice < product.price;
    const badge = getBadgeById(product.badge);

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart(product);
        }
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    return (
        <>
            <Header />

            {/* Page Heading */}
            <section
                className="relative h-64 bg-cover bg-center flex items-center"
                style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#010101] to-[#010101]/70" />
                <div className="container mx-auto px-4 relative z-10 pt-20">
                    <h3 className="text-4xl font-bold text-white mb-4">{product.name}</h3>
                    <nav className="flex items-center gap-2 text-white/80">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>&gt;</span>
                        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
                        <span>&gt;</span>
                        <span className="text-white">{product.name}</span>
                    </nav>
                </div>
            </section>

            {/* Product Details */}
            <section className="container mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Product Image */}
                    <div className="relative">
                        <div className="rounded-3xl overflow-hidden shadow-2xl relative">
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={600}
                                height={450}
                                className="w-full object-cover"
                            />
                            {/* Badge on image */}
                            {badge && badge.active && (
                                <div className="absolute top-4 left-4">
                                    <BadgeDisplay badge={badge} size="md" />
                                </div>
                            )}
                            {/* Download count */}
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                {formatDownloads(product.downloads || 0)}
                            </div>
                            {/* Status overlays */}
                            <div className="absolute bottom-4 left-4 flex gap-2">
                                {product.trending && (
                                    <span className="px-3 py-1 bg-blue-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                                        TRENDING
                                    </span>
                                )}
                                {product.mostPlayed && (
                                    <span className="px-3 py-1 bg-orange-500/90 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                                        MOST PLAYED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col justify-center">
                        <h4 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h4>

                        {/* Rating */}
                        <div className="flex items-center gap-3 mb-4">
                            <StarRating rating={product.rating || 0} size={20} />
                            <span className="text-sm text-gray-500">({product.rating || 0}/5)</span>
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                            {hasDiscount && (
                                <span className="text-2xl text-gray-400 line-through">{formatRupiah(product.price)}</span>
                            )}
                            <span className="text-3xl font-bold text-[#010101]">{formatRupiah(displayPrice)}</span>
                            {hasDiscount && (
                                <span className="px-3 py-1 bg-[#ee626b] text-white text-sm font-bold rounded-full">
                                    HEMAT {formatRupiah(product.price - product.salePrice!)}
                                </span>
                            )}
                        </div>

                        {/* Download count */}
                        <div className="flex items-center gap-2 mb-4 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span className="text-sm font-semibold">{formatDownloads(product.downloads || 0)} Downloads</span>
                        </div>

                        {/* Platform tags */}
                        {product.platform && product.platform.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {product.platform.map((p) => (
                                    <span key={p} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        )}

                        <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>

                        {/* Add to Cart */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="w-12 h-12 text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    -
                                </button>
                                <span className="w-12 text-center font-semibold">{quantity}</span>
                                <button
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="w-12 h-12 text-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 h-12 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 ${
                                    addedToCart
                                        ? 'bg-green-500 text-white'
                                        : 'bg-[#010101] text-white hover:bg-[#ee626b]'
                                }`}
                            >
                                {addedToCart ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        ADDED TO CART!
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="9" cy="21" r="1" />
                                            <circle cx="20" cy="21" r="1" />
                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                        </svg>
                                        ADD TO CART
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Buy Now Button */}
                        <div className="mb-8">
                            <Link
                                href={`/checkout?productId=${product.id}`}
                                className="w-full h-12 font-semibold rounded-full bg-[#ee626b] text-white hover:bg-[#d4555d] transition-colors flex items-center justify-center gap-3"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                    <line x1="7" y1="7" x2="7.01" y2="7" />
                                </svg>
                                BUY NOW - {formatRupiah(displayPrice)}
                            </Link>
                        </div>

                        {/* Product Meta */}
                        <ul className="space-y-3 border-t border-gray-200 pt-6">
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">Game ID:</span>
                                <span className="text-gray-600 uppercase">{product.slug}</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">Genre:</span>
                                <span className="text-[#010101] capitalize">{product.category}</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">Status:</span>
                                <div className="flex gap-2">
                                    {product.trending && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Trending</span>
                                    )}
                                    {product.mostPlayed && (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">Most Played</span>
                                    )}
                                    {product.featured && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">Featured</span>
                                    )}
                                    {!product.trending && !product.mostPlayed && !product.featured && (
                                        <span className="text-gray-500 text-sm">Standard</span>
                                    )}
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">Tags:</span>
                                <div className="flex flex-wrap gap-2">
                                    {product.tags.map((tag) => (
                                        <span key={tag} className="text-[#010101] hover:text-[#ee626b] cursor-pointer">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Separator */}
                <hr className="my-16 border-gray-200" />

                {/* Tabs */}
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('description')}
                            className={`flex-1 py-4 font-semibold transition-colors ${activeTab === 'description'
                                ? 'bg-[#010101] text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Description
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 py-4 font-semibold transition-colors ${activeTab === 'reviews'
                                ? 'bg-[#010101] text-white'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Reviews (3)
                        </button>
                    </div>
                    <div className="p-8">
                        {activeTab === 'description' ? (
                            <div className="prose max-w-none text-gray-600">
                                <p>{product.description}</p>
                                <br />
                                <p>
                                    Experience the ultimate gaming adventure with stunning graphics, immersive gameplay,
                                    and an unforgettable story. This game offers hours of entertainment with its rich
                                    world, challenging missions, and multiplayer modes.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {[
                                    { name: 'John Doe', rating: 5, comment: 'Amazing game! Highly recommended.' },
                                    { name: 'Jane Smith', rating: 4, comment: 'Great graphics and storyline.' },
                                    { name: 'Bob Wilson', rating: 5, comment: 'Best game I have ever played!' },
                                ].map((review, index) => (
                                    <div key={index} className="border-b border-gray-100 pb-6 last:border-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold text-gray-900">{review.name}</span>
                                            <StarRating rating={review.rating} size={14} />
                                        </div>
                                        <p className="text-gray-600">{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Related Games */}
            {relatedProducts.length > 0 && (
                <section className="container mx-auto px-4 pb-16">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                        <div className="section-heading mb-6 md:mb-0">
                            <h6 className="capitalize">{product.category}</h6>
                            <h2>Related Games</h2>
                        </div>
                        <Link href="/shop" className="btn-primary">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((related) => (
                            <ProductCard key={related.id} product={related} />
                        ))}
                    </div>
                </section>
            )}

            <Footer />
        </>
    );
}
