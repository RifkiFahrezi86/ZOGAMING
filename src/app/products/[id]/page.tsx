'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import { BadgeDisplay, StarRating } from '@/components/ui/BadgeIcon';
import { formatRupiah, formatDownloads, Review } from '@/lib/types';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { products, categories, addToCart, getBadgeById } = useData();
    const { user } = useAuth();
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const [addedToCart, setAddedToCart] = useState(false);

    // Review state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const product = products.find((p) => p.id === resolvedParams.id);
    const relatedProducts = products
        .filter((p) => p.category.toLowerCase() === product?.category.toLowerCase() && p.id !== product?.id)
        .slice(0, 4);

    if (!product) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Tidak Ditemukan</h2>
                        <Link href="/shop" className="btn-primary">
                            Kembali ke Shop
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Fetch reviews from database
    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch(`/api/reviews?productId=${resolvedParams.id}`);
            const data = await res.json();
            if (data.reviews) {
                setReviews(data.reviews);
                setTotalReviews(data.totalReviews);
                setAvgRating(data.avgRating);
                setCanReview(data.canReview);
                setHasReviewed(data.hasReviewed);
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        }
    }, [resolvedParams.id]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews, user]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setReviewError('');
        setReviewLoading(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    rating: reviewRating,
                    comment: reviewComment,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setReviewError(data.error || 'Gagal mengirim ulasan');
            } else {
                setReviewSuccess(true);
                setReviewComment('');
                setReviewRating(5);
                fetchReviews(); // Refresh reviews
            }
        } catch {
            setReviewError('Terjadi kesalahan');
        } finally {
            setReviewLoading(false);
        }
    };

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
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            <span className="text-sm font-semibold">{formatDownloads(product.downloads || 0)} Downloads</span>
                        </div>

                        {/* Platform tags */}
                        {product.platform && product.platform.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {product.platform.map((p) => (
                                    <Link key={p} href={`/shop?platform=${encodeURIComponent(p)}`} className={`platform-badge ${p.toLowerCase() === 'pc' ? 'pc' : p.toLowerCase() === 'ps5' ? 'ps5' : p.toLowerCase() === 'xbox' ? 'xbox' : ''} px-3 py-1.5 text-xs font-bold rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1.5`}>
                                        {p === 'PC' && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                                        {p === 'PS5' && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.235-1.268-4.783-4.567-5.58-1.47-.355-3.544-.658-5.264-1.749z" /></svg>}
                                        {p === 'Xbox' && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417z" /></svg>}
                                        {p}
                                    </Link>
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
                                className={`flex-1 h-12 font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-3 ${addedToCart
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
                                        MASUKKAN KERANJANG
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

                        {/* Steam Sharing Trust Banner */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-800">Akun Resmi Steam Sharing</p>
                                    <p className="text-xs text-green-600">Bukan crack &bull; Garansi akun &bull; Proses via WhatsApp</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Meta */}
                        <ul className="space-y-3 border-t border-gray-200 pt-6">
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">ID Game:</span>
                                <span className="text-gray-600 uppercase">{product.slug}</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-semibold text-gray-900">Genre:</span>
                                <Link href={`/shop?category=${product.category}`} className="text-[#010101] capitalize hover:text-[#ee626b] transition-colors font-medium">{product.category}</Link>
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
                                        <Link key={tag} href={`/shop?tag=${encodeURIComponent(tag)}`} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full hover:bg-[#010101] hover:text-white transition-all">
                                            {tag}
                                        </Link>
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
                            Ulasan ({totalReviews})
                        </button>
                    </div>
                    <div className="p-8">
                        {activeTab === 'description' ? (
                            <div className="prose max-w-none text-gray-600">
                                <p>{product.description}</p>
                                <br />
                                <p>
                                    Nikmati pengalaman gaming terbaik dengan grafis memukau dan gameplay yang imersif.
                                    Game ini adalah akun resmi Steam Sharing — bukan crack! Anda bisa langsung main
                                    setelah menerima akun via WhatsApp.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Review Summary */}
                                {totalReviews > 0 && (
                                    <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                                        <div className="text-center">
                                            <div className="text-4xl font-bold text-gray-900">{avgRating}</div>
                                            <StarRating rating={avgRating} size={16} />
                                            <div className="text-sm text-gray-500 mt-1">{totalReviews} ulasan</div>
                                        </div>
                                    </div>
                                )}

                                {/* Review Form - only for customers who purchased */}
                                {user && canReview && !hasReviewed && !reviewSuccess && (
                                    <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h4 className="font-semibold text-gray-900 mb-4">Tulis Ulasan Anda</h4>

                                        {/* Star Rating Selector */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        type="button"
                                                        key={star}
                                                        onClick={() => setReviewRating(star)}
                                                        className="transition-transform hover:scale-110"
                                                    >
                                                        <svg width="28" height="28" viewBox="0 0 24 24"
                                                            fill={star <= reviewRating ? '#f59e0b' : 'none'}
                                                            stroke={star <= reviewRating ? '#f59e0b' : '#d1d5db'}
                                                            strokeWidth="2"
                                                        >
                                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ulasan</label>
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder="Ceritakan pengalaman Anda dengan game ini..."
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none resize-none text-gray-900"
                                                required
                                                minLength={5}
                                            />
                                        </div>

                                        {reviewError && (
                                            <p className="text-red-500 text-sm mb-3">{reviewError}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={reviewLoading || reviewComment.trim().length < 5}
                                            className="px-6 py-2.5 bg-[#ee626b] text-white font-semibold rounded-full hover:bg-[#d4555d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {reviewLoading ? 'Mengirim...' : 'Kirim Ulasan'}
                                        </button>
                                    </form>
                                )}

                                {/* Success message */}
                                {reviewSuccess && (
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                        Terima kasih! Ulasan Anda berhasil dikirim.
                                    </div>
                                )}

                                {/* Already reviewed message */}
                                {user && hasReviewed && !reviewSuccess && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-800 text-sm">
                                        ✓ Anda sudah memberikan ulasan untuk produk ini.
                                    </div>
                                )}

                                {/* Login prompt - Jadilah customer */}
                                {!user && (
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-5 text-center">
                                        <div className="w-12 h-12 bg-[#ee626b]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ee626b" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        </div>
                                        <p className="font-semibold text-gray-900 mb-1">Jadilah Customer untuk Memberikan Ulasan!</p>
                                        <p className="text-sm text-gray-500 mb-3">Beli game ini dan bagikan pengalaman gaming kamu 🎮</p>
                                        <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2 bg-[#ee626b] text-white text-sm font-semibold rounded-full hover:bg-[#d4555d] transition-colors">
                                            Login / Daftar Sekarang
                                        </Link>
                                    </div>
                                )}

                                {/* Customer logged in but hasn't purchased */}
                                {user && user.role === 'customer' && !canReview && !hasReviewed && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-5 text-center">
                                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                        </div>
                                        <p className="font-semibold text-yellow-800 mb-1">Beli Game Ini Dulu Yuk!</p>
                                        <p className="text-sm text-yellow-700">Kamu harus membeli dan menyelesaikan pesanan game ini sebelum bisa memberikan ulasan 🛒</p>
                                    </div>
                                )}

                                {/* Reviews List */}
                                {reviews.length > 0 ? (
                                    reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-[#ee626b] to-[#d4555d] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                        {review.userName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{review.userName}</span>
                                                    <StarRating rating={review.rating} size={14} />
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 ml-10">{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        <p className="font-medium">Belum ada ulasan</p>
                                        <p className="text-sm mt-1">Jadilah yang pertama mengulas game ini!</p>
                                    </div>
                                )}
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
                            <h2>Game Serupa</h2>
                        </div>
                        <Link href="/shop" className="btn-primary">
                            Lihat Semua
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
