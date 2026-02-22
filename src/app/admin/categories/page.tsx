'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useData } from '@/lib/DataContext';
import { Category } from '@/lib/types';

export default function AdminCategoriesPage() {
    const { categories, products, addCategory, updateCategory, deleteCategory } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [fetchingImage, setFetchingImage] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        image: '',
        description: '',
    });

    const getCategoryProductCount = (slug: string) =>
        products.filter((p) => p.category.toLowerCase() === slug.toLowerCase()).length;

    const handleImageUrl = async (url: string) => {
        setImageUrlInput(url);
        if (!url || url.startsWith('/') || /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url)) {
            setFormData(prev => ({ ...prev, image: url }));
            return;
        }
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

    const openAddModal = () => {
        setEditingCategory(null);
        setImageUrlInput('');
        setFormData({
            name: '',
            slug: '',
            image: '/images/categories-01.jpg',
            description: '',
        });
        setIsModalOpen(true);
    };

    const openEditModal = (category: Category) => {
        setEditingCategory(category);
        setImageUrlInput('');
        setFormData({
            name: category.name,
            slug: category.slug,
            image: category.image,
            description: category.description,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const categoryData = {
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            image: formData.image,
            description: formData.description,
        };

        if (editingCategory) {
            updateCategory(editingCategory.id, categoryData);
        } else {
            addCategory(categoryData);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            deleteCategory(id);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Categories</h1>
                    <p className="text-slate-400">Manage game categories</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="px-4 py-2 bg-[#010101] text-white rounded-xl font-medium hover:bg-[#000000] transition-colors flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Category
                </button>
            </div>

            {/* Categories Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <div key={category.id} className="admin-card overflow-hidden group">
                        <div className="relative h-40">
                            <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] to-transparent" />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-bold text-white mb-1">{category.name}</h3>
                            <p className="text-slate-400 text-sm mb-4">{category.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="px-3 py-1 bg-slate-700/50 text-white text-sm font-medium rounded-full">
                                    {getCategoryProductCount(category.slug)} Products
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        title="Edit"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                                <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={imageUrlInput || formData.image}
                                        onChange={(e) => { setImageUrlInput(e.target.value); setFormData({ ...formData, image: e.target.value }); }}
                                        onBlur={(e) => handleImageUrl(e.target.value)}
                                        className="flex-1 h-10 px-4 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-[#010101]"
                                        placeholder="/images/categories-01.jpg atau https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleImageUrl(imageUrlInput || formData.image)}
                                        disabled={fetchingImage}
                                        className="px-3 h-10 bg-slate-700 text-white text-xs rounded-xl hover:bg-slate-600 transition-colors disabled:opacity-50 flex-shrink-0"
                                    >
                                        {fetchingImage ? (
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        ) : 'Ambil'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Paste URL halaman web — gambar diambil otomatis</p>
                                {formData.image && formData.image !== imageUrlInput && imageUrlInput && (
                                    <p className="text-xs text-green-400 mt-1">Gambar ditemukan!</p>
                                )}
                                {formData.image && (
                                    <div className="mt-2 rounded-xl overflow-hidden bg-slate-800 h-24 w-full relative">
                                        <Image src={formData.image} alt="Preview" fill className="object-cover" />
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
                                    {editingCategory ? 'Update Category' : 'Add Category'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
