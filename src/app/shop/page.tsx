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

    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState(qParam);
    const [sortBy, setSortBy] = useState<string>('default');

    useEffect(() => {
        if (qParam) setSearchQuery(qParam);
    }, [qParam]);

    const filteredProducts = useMemo(() => {
        let result = products;

        // Category filter
        if (activeCategory !== 'all') {
            result = result.filter((p) => p.category === activeCategory);
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
    }, [products, activeCategory, searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
        setCurrentPage(1);
    };

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
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        )}
                    </div>
                </form>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    {/* Category Filters */}
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => handleCategoryChange('all')}
                            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === 'all'
                                    ? 'bg-[#010101] text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Semua
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category.slug)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all capitalize ${activeCategory === category.slug
                                        ? 'bg-[#010101] text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 px-4 pr-8 rounded-full border border-gray-200 text-sm text-gray-600 outline-none focus:border-[#ee626b] bg-white cursor-pointer"
                    >
                        <option value="default">Urutkan</option>
                        <option value="name">Nama A-Z</option>
                        <option value="price-low">Harga Termurah</option>
                        <option value="price-high">Harga Termahal</option>
                        <option value="rating">Rating Tertinggi</option>
                        <option value="downloads">Paling Populer</option>
                    </select>
                </div>

                {/* Results count */}
                {searchQuery && (
                    <p className="text-sm text-gray-500 mb-6 text-center">
                        {filteredProducts.length} game ditemukan untuk &quot;{searchQuery}&quot;
                    </p>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {paginatedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {/* Empty State */}
                {paginatedProducts.length === 0 && (
                    <div className="text-center py-20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mx-auto mb-4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
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
