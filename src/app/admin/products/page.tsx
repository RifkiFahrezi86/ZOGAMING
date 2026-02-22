'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useData } from '@/lib/DataContext';
import { Product, formatRupiah, formatDownloads } from '@/lib/types';
import { BadgeDisplay } from '@/components/ui/BadgeIcon';

export default function AdminProductsPage() {
    const { products, categories, badges, addProduct, updateProduct, deleteProduct, getBadgeById } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [fetchingImage, setFetchingImage] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');

    const handleImageUrl = async (url: string) => {
        setImageUrlInput(url);
        // If it's a direct image URL or local path, use directly
        if (!url || url.startsWith('/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url)) {
            setFormData(prev => ({ ...prev, image: url }));
            return;
        }
        // If it looks like a webpage URL, try to fetch og:image
        if (url.startsWith('http')) {
            setFetchingImage(true);
            try {
                const res = await fetch(`/api/og-image?url=${encodeURIComponent(url)}`);
                const data = await res.json();
                if (data.imageUrl) {
                    setFormData(prev => ({ ...prev, image: data.imageUrl }));
                } else {
                    setFormData(prev => ({ ...prev, image: url }));
                }
            } catch {
                setFormData(prev => ({ ...prev, image: url }));
            } finally {
                setFetchingImage(false);
            }
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category: '',
        price: '',
        salePrice: '',
        image: '',
        description: '',
        tags: '',
        featured: false,
        trending: false,
        mostPlayed: false,
        badge: '',
        rating: '5',
        platform: '' as string,
        downloads: '0',
    });

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || product.category.toLowerCase() === filterCategory.toLowerCase();
        return matchesSearch && matchesCategory;
    });

    const openAddModal = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            slug: '',
            category: categories[0]?.slug || '',
            price: '',
            salePrice: '',
            image: '/images/trending-01.jpg',
            description: '',
            tags: '',
            featured: false,
            trending: false,
            mostPlayed: false,
            badge: '',
            rating: '5',
            platform: 'PC',
            downloads: '0',
        });
        setImageUrlInput('');
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: product.price.toString(),
            salePrice: product.salePrice?.toString() || '',
            image: product.image,
            description: product.description,
            tags: product.tags.join(', '),
            featured: product.featured,
            trending: product.trending,
            mostPlayed: product.mostPlayed || false,
            badge: product.badge || '',
            rating: (product.rating || 5).toString(),
            platform: (product.platform || []).join(', '),
            downloads: (product.downloads || 0).toString(),
        });
        setImageUrlInput('');
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productData = {
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            category: formData.category,
            price: parseFloat(formData.price),
            salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
            image: formData.image,
            description: formData.description,
            tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
            featured: formData.featured,
            trending: formData.trending,
            mostPlayed: formData.mostPlayed,
            badge: formData.badge || null,
            rating: parseInt(formData.rating) || 5,
            platform: formData.platform.split(',').map((p) => p.trim()).filter(Boolean),
            downloads: parseInt(formData.downloads) || 0,
        };

        if (editingProduct) {
            updateProduct(editingProduct.id, productData);
        } else {
            addProduct(productData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Products</h1>
                    <p className="text-slate-400">Manage your game catalog</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#010101] text-white rounded-xl font-medium hover:bg-[#000000] transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Product
                </button>
            </div>

            {/* Filters */}
            <div className="admin-card p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 outline-none focus:border-[#010101] transition-colors"
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101] transition-colors"
                >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            <div className="admin-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full admin-table">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left">Product</th>
                                <th className="px-6 py-4 text-left">Category</th>
                                <th className="px-6 py-4 text-left">Price</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-left">Badge</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const productBadge = getBadgeById(product.badge);
                                return (
                                    <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{product.name}</p>
                                                    <p className="text-slate-400 text-sm">{product.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-300 capitalize">{product.category}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {product.salePrice && (
                                                    <span className="text-slate-500 line-through text-sm">{formatRupiah(product.price)}</span>
                                                )}
                                                <span className="text-white font-semibold">
                                                    {formatRupiah(product.salePrice || product.price)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {product.trending && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium">
                                                        Trending
                                                    </span>
                                                )}
                                                {product.mostPlayed && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full font-medium">
                                                        Most Played
                                                    </span>
                                                )}
                                                {product.featured && (
                                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full font-medium">
                                                        Featured
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {productBadge && productBadge.active ? (
                                                <BadgeDisplay badge={productBadge} size="sm" />
                                            ) : (
                                                <span className="text-slate-500 text-xs">None</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(product)}
                                                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-400">No products found.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        required
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Harga (Rp)</label>
                                    <input
                                        type="number"
                                        step="1000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Harga Promo (Rp)</label>
                                    <input
                                        type="number"
                                        step="1000"
                                        value={formData.salePrice}
                                        onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        placeholder="Kosongkan jika tidak promo"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={imageUrlInput || formData.image}
                                        onChange={(e) => { setImageUrlInput(e.target.value); setFormData({ ...formData, image: e.target.value }); }}
                                        onBlur={(e) => handleImageUrl(e.target.value)}
                                        className="flex-1 h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        placeholder="/images/game.jpg atau https://store.steampowered.com/app/..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleImageUrl(imageUrlInput || formData.image)}
                                        disabled={fetchingImage}
                                        className="px-3 h-10 bg-slate-700 text-white text-xs rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50 flex-shrink-0"
                                    >
                                        {fetchingImage ? (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        ) : 'Ambil Gambar'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Paste URL halaman web (Steam, dll) — gambar akan diambil otomatis. Atau paste URL gambar langsung.</p>
                                {formData.image && formData.image !== imageUrlInput && imageUrlInput && (
                                    <p className="text-xs text-green-400 mt-1">Gambar ditemukan: {formData.image.substring(0, 60)}...</p>
                                )}
                                {formData.image && (
                                    <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
                                        <Image src={formData.image} alt="Preview" width={80} height={80} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101] resize-none"
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        placeholder="Action, Adventure, RPG"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Platform (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        placeholder="PC, PS5, Xbox"
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Badge</label>
                                    <select
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                    >
                                        <option value="">No Badge</option>
                                        {badges.filter(b => b.active).map((badge) => (
                                            <option key={badge.id} value={badge.id}>{badge.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Rating (1-5)</label>
                                    <select
                                        value={formData.rating}
                                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                                        className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                    >
                                        {[1, 2, 3, 4, 5].map((r) => (
                                            <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Downloads Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Jumlah Download</label>
                                <input
                                    type="number"
                                    value={formData.downloads}
                                    onChange={(e) => setFormData({ ...formData, downloads: e.target.value })}
                                    className="w-full h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-slate-500 mt-1">Ditampilkan sebagai: {formatDownloads(parseInt(formData.downloads) || 0)}</p>
                            </div>

                            {/* Status checkboxes */}
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-300 mb-3">Product Status</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-purple-500"
                                        />
                                        <span className="text-purple-400 text-sm font-medium">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.trending}
                                            onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-blue-500"
                                        />
                                        <span className="text-blue-400 text-sm font-medium">Trending</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.mostPlayed}
                                            onChange={(e) => setFormData({ ...formData, mostPlayed: e.target.checked })}
                                            className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-orange-500"
                                        />
                                        <span className="text-orange-400 text-sm font-medium">Most Played</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#010101] text-white rounded-xl font-medium hover:bg-[#000000] transition-colors"
                                >
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
