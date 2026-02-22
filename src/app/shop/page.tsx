'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/ui/ProductCard';
import Preloader from '@/components/ui/Preloader';
import { useData } from '@/lib/DataContext';

const ITEMS_PER_PAGE = 12;

export default function ShopPage() {
    return (
        <Suspense fallback={<Preloader />}>
            <ShopContent />
        </Suspense>
    );
}

function ShopContent() {
    const { products, categories } = useData();
    const searchParams = useSearchParams();
    const qParam = searchParams.get('q') || '';
    const platformParam = searchParams.get('platform') || '';
    const tagParam = searchParams.get('tag') || '';
    const categoryParam = searchParams.get('category') || '';

    const [activeCategory, setActiveCategory] = useState<string>(categoryParam || 'all');
    const [activePlatform, setActivePlatform] = useState<string>(platformParam || 'all');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState(qParam);
    const [sortBy, setSortBy] = useState<string>('default');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // All unique platforms from products
    const allPlatforms = useMemo(() => {
        const platforms = new Set<string>();
        products.forEach(p => (p.platform || []).forEach(pl => platforms.add(pl)));
        return Array.from(platforms).sort();
    }, [products]);

    useEffect(() => {
        if (qParam) setSearchQuery(qParam);
    }, [qParam]);

    useEffect(() => {
        if (platformParam) setActivePlatform(platformParam);
    }, [platformParam]);

    useEffect(() => {
        if (tagParam) setSearchQuery(tagParam);
    }, [tagParam]);

    useEffect(() => {
        if (categoryParam) setActiveCategory(categoryParam);
    }, [categoryParam]);

    const filteredProducts = useMemo(() => {
        let result = products;

        // Category filter: matches by category field OR by tags
        // This ensures products tagged with "RPG" appear under RPG genre even if their primary category is different
        if (activeCategory !== 'all') {
            const catLower = activeCategory.toLowerCase();
            // Find the category name from the categories list for tag matching
            const catName = categories.find(c => c.slug.toLowerCase() === catLower)?.name?.toLowerCase() || catLower;
            result = result.filter((p) =>
                p.category.toLowerCase() === catLower ||
                p.category.toLowerCase() === catName ||
                (p.tags || []).some(t => t.toLowerCase() === catLower || t.toLowerCase() === catName)
            );
        }

        // Platform filter
        if (activePlatform !== 'all') {
            result = result.filter((p) => (p.platform || []).some(pl => pl.toLowerCase() === activePlatform.toLowerCase()));
        }

        // Search filter (name, category, tags, platform, description)
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter((p) =>
                p.name.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q) ||
                (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
                (p.platform || []).some(pl => pl.toLowerCase().includes(q)) ||
                (p.slug || '').toLowerCase().includes(q)
            );
        }

        // Sort
        if (sortBy === 'price-low') {
            result = [...result].sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
        } else if (sortBy === 'price-high') {
            result = [...result].sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
        } else if (sortBy === 'name') {
            result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortBy === 'rating') {
            result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === 'downloads') {
            result = [...result].sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        }

        return result;
    }, [products, activeCategory, activePlatform, searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        setCurrentPage(1);
    };

    const handlePlatformChange = (platform: string) => {
        setActivePlatform(platform);
        setCurrentPage(1);
    };

    const sortOptions = [
        { value: 'default', label: 'Urutkan' },
        { value: 'name', label: 'Nama A-Z' },
        { value: 'price-low', label: 'Harga Termurah' },
        { value: 'price-high', label: 'Harga Termahal' },
        { value: 'rating', label: 'Rating Tertinggi' },
        { value: 'downloads', label: 'Paling Populer' },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
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
                    <h3 className="text-4xl font-bold text-white mb-4">Katalog Game</h3>
                    <nav className="flex items-center gap-2 text-white/80">
                        <Link href="/" className="hover:text-white transition-colors">
                            Home
                        </Link>
                        <span>&gt;</span>
                        <span className="text-white">Shop</span>
                    </nav>
                </div>
            </section>

            {/* Shop Content */}
            <section className="container mx-auto px-4 py-16">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-10">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="absolute left-5 top-1/2 -translate-y-1/2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Cari game, genre, platform, tag..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full h-14 pl-14 pr-6 rounded-full border-2 border-gray-200 outline-none focus:border-[#ee626b] transition-colors text-gray-700 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        )}
                    </div>
                </form>

                {/* Genre Filters */}
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Genre</h3>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeCategory === 'all'
                                ? 'bg-[#010101] text-white shadow-lg shadow-black/20'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category.slug)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize ${activeCategory === category.slug
                                    ? 'bg-[#010101] text-white shadow-lg shadow-black/20'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Platform Filters + Sort Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Platform</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handlePlatformChange('all')}
                                className={`platform-tag ${activePlatform === 'all' ? 'active' : ''}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                                Semua
                            </button>
                            {allPlatforms.map((platform) => (
                                <button
                                    key={platform}
                                    onClick={() => handlePlatformChange(platform)}
                                    className={`platform-tag ${activePlatform.toLowerCase() === platform.toLowerCase() ? 'active' : ''}`}
                                >
                                    {platform === 'PC' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                                    {platform === 'PS5' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.235-1.268-4.783-4.567-5.58-1.47-.355-3.544-.658-5.264-1.749zM1.085 18.286l1.27.453c1.484.496 2.997 1.003 5.425.163 2.27-.786 2.598-2.173 1.63-2.843-.872-.603-2.419-.859-4.381-.564l-1.64.226V13.72l.79-.109c2.18-.307 3.858-.009 5.082.554v-2.79C7.658 10.55 5.192 10.89 3.15 11.78c-2.28.993-3.06 2.462-2.24 3.967.378.691 1.01 1.2 1.907 1.554l-1.732.985z" /></svg>}
                                    {platform === 'Xbox' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.102 21.033A11.947 11.947 0 0 0 12 24a11.96 11.96 0 0 0 7.902-2.967c1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zM12 3.5S9.5 0 7 0C4.462 0 2.5 1.735 2.5 3.5c0 .713.267 1.424.685 2.07C5.056 3.734 8.13 3.04 12 3.5zm9.815 2.07c.418-.646.685-1.357.685-2.07C22.5 1.735 20.538 0 18 0c-2.5 0-5 3.5-5 3.5 3.87-.46 6.944.234 8.815 2.07z" /></svg>}
                                    {platform !== 'PC' && platform !== 'PS5' && platform !== 'Xbox' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="3" width="12" height="18" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>}
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Sort Dropdown */}
                    <div className="relative min-w-[180px]">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="w-full h-11 px-5 pr-10 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:border-gray-300 transition-all flex items-center justify-between gap-2"
                        >
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" /></svg>
                                {sortOptions.find(o => o.value === sortBy)?.label}
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`absolute right-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        {isSortOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 animate-fade-in">
                                    {sortOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => { setSortBy(option.value); setIsSortOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${sortBy === option.value
                                                ? 'bg-[#010101] text-white font-semibold'
                                                : 'text-gray-600 hover:bg-gray-50 font-medium'
                                                }`}
                                        >
                                            {sortBy === option.value && (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            )}
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Filters & Results Count */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">{filteredProducts.length} game</span>
                        {activeCategory !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-[#ee626b] text-xs font-semibold rounded-full">
                                Genre: {categories.find(c => c.slug === activeCategory)?.name || activeCategory}
                                <button onClick={() => setActiveCategory('all')} className="ml-1 hover:text-red-700">×</button>
                            </span>
                        )}
                        {activePlatform !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                                Platform: {activePlatform}
                                <button onClick={() => setActivePlatform('all')} className="ml-1 hover:text-blue-800">×</button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                &quot;{searchQuery}&quot;
                                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-gray-800">×</button>
                            </span>
                        )}
                        {(activeCategory !== 'all' || activePlatform !== 'all' || searchQuery) && (
                            <button
                                onClick={() => { setActiveCategory('all'); setActivePlatform('all'); setSearchQuery(''); setCurrentPage(1); }}
                                className="text-xs text-red-500 hover:text-red-700 font-semibold underline"
                            >
                                Reset semua
                            </button>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {paginatedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Empty State */}
                {paginatedProducts.length === 0 && (
                    <div className="text-center py-20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mx-auto mb-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                        <p className="text-gray-500 text-lg">Tidak ada game ditemukan.</p>
                        <p className="text-gray-400 text-sm mt-1">Coba kata kunci atau kategori lain.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-12">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-[#010101] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &lt;
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 rounded-full font-semibold transition-colors ${currentPage === page
                                    ? 'bg-[#010101] text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-[#010101] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            &gt;
                        </button>
                    </div>
                )}
            </section>

            <Footer />
        </>
    );
}
