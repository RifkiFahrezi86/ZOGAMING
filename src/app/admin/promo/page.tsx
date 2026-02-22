'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useData } from '@/lib/DataContext';
import { formatRupiah } from '@/lib/types';

export default function AdminPromoPage() {
    const { products, settings, updateSettings } = useData();
    const [promoProductId, setPromoProductId] = useState<string>('');
    const [promoTitle, setPromoTitle] = useState<string>('DEAL OF THE DAY');
    const [promoActive, setPromoActive] = useState<boolean>(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (settings.promoProductId) setPromoProductId(settings.promoProductId);
        if (settings.promoTitle) setPromoTitle(settings.promoTitle);
        if (settings.promoActive !== undefined) setPromoActive(settings.promoActive !== false);
    }, [settings]);

    const selectedProduct = products.find(p => p.id === promoProductId);

    const filteredProducts = products.filter(p => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            await updateSettings({
                promoProductId,
                promoTitle,
                promoActive,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Gagal menyimpan promo');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Promo / Deal of the Day</h1>
                    <p className="text-slate-400 text-sm mt-1">Atur produk yang ditampilkan sebagai promo di halaman utama.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        saved
                            ? 'bg-green-500 text-white'
                            : 'bg-[#ee626b] text-white hover:bg-[#d4555d]'
                    } disabled:opacity-50`}
                >
                    {saving ? 'Menyimpan...' : saved ? '✓ Tersimpan!' : 'Simpan Promo'}
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Promo Active Toggle */}
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4">Status Promo</h3>
                        <button
                            onClick={() => setPromoActive(!promoActive)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                promoActive
                                    ? 'bg-green-500/10 border border-green-500/30'
                                    : 'bg-slate-800 border border-slate-600'
                            }`}
                        >
                            <span className={`text-sm font-semibold ${promoActive ? 'text-green-400' : 'text-slate-400'}`}>
                                {promoActive ? '✓ Promo Aktif' : '✗ Promo Nonaktif'}
                            </span>
                            <div className={`w-12 h-6 rounded-full relative transition-colors ${promoActive ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${promoActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </div>
                        </button>
                        <p className="text-xs text-slate-500 mt-2">
                            {promoActive ? 'Section promo ditampilkan di homepage.' : 'Section promo disembunyikan dari homepage.'}
                        </p>
                    </div>

                    {/* Promo Title */}
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4">Judul Promo</h3>
                        <input
                            type="text"
                            value={promoTitle}
                            onChange={(e) => setPromoTitle(e.target.value)}
                            placeholder="DEAL OF THE DAY"
                            className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-2">Label badge yang tampil di section promo.</p>
                    </div>

                    {/* Preview */}
                    {selectedProduct && (
                        <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
                            <h3 className="text-sm font-bold text-white mb-4">Preview Produk Terpilih</h3>
                            <div className="relative aspect-video rounded-xl overflow-hidden mb-4">
                                <Image
                                    src={selectedProduct.image}
                                    alt={selectedProduct.name}
                                    fill
                                    className="object-cover"
                                />
                                {selectedProduct.salePrice && (
                                    <div className="absolute top-3 left-3">
                                        <span className="px-3 py-1 bg-[#ee626b] text-white text-xs font-bold rounded-full">
                                            -{Math.round(((selectedProduct.price - selectedProduct.salePrice) / selectedProduct.price) * 100)}% OFF
                                        </span>
                                    </div>
                                )}
                            </div>
                            <h4 className="text-white font-bold text-lg">{selectedProduct.name}</h4>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{selectedProduct.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                                {selectedProduct.salePrice && (
                                    <span className="text-slate-500 line-through text-sm">{formatRupiah(selectedProduct.price)}</span>
                                )}
                                <span className="text-[#ee626b] font-bold text-lg">{formatRupiah(selectedProduct.salePrice || selectedProduct.price)}</span>
                            </div>
                            <div className="flex gap-1.5 mt-3">
                                {(selectedProduct.platform || []).map(p => (
                                    <span key={p} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded">
                                        {p}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Product Selection */}
                <div className="lg:col-span-2">
                    <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-white mb-4">Pilih Produk Promo</h3>

                        {/* Search */}
                        <div className="relative mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari game..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-[#ee626b] focus:border-transparent outline-none"
                            />
                        </div>

                        {/* No promo option */}
                        <button
                            onClick={() => setPromoProductId('')}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl mb-2 transition-all ${
                                !promoProductId
                                    ? 'bg-slate-700/50 border-2 border-[#ee626b]'
                                    : 'bg-slate-800/30 border-2 border-transparent hover:border-slate-600'
                            }`}
                        >
                            <div className="w-16 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-semibold text-white">Auto (Produk Diskon Pertama)</p>
                                <p className="text-xs text-slate-400">Otomatis pilih produk yang memiliki harga sale.</p>
                            </div>
                            {!promoProductId && (
                                <div className="w-6 h-6 rounded-full bg-[#ee626b] flex items-center justify-center flex-shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                </div>
                            )}
                        </button>

                        {/* Product list */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {filteredProducts.map((product) => {
                                const isSelected = promoProductId === product.id;
                                const hasSale = product.salePrice && product.salePrice < product.price;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => setPromoProductId(product.id)}
                                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                                            isSelected
                                                ? 'bg-slate-700/50 border-2 border-[#ee626b]'
                                                : 'bg-slate-800/30 border-2 border-transparent hover:border-slate-600'
                                        }`}
                                    >
                                        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                                                {hasSale && (
                                                    <span className="px-1.5 py-0.5 bg-[#ee626b]/20 text-[#ee626b] text-[10px] font-bold rounded flex-shrink-0">
                                                        -{Math.round(((product.price - product.salePrice!) / product.price) * 100)}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-400 capitalize">{product.category}</span>
                                                <span className="text-xs text-slate-600">•</span>
                                                {hasSale ? (
                                                    <>
                                                        <span className="text-xs text-slate-500 line-through">{formatRupiah(product.price)}</span>
                                                        <span className="text-xs text-[#ee626b] font-bold">{formatRupiah(product.salePrice!)}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400">{formatRupiah(product.price)}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {(product.platform || []).map(p => (
                                                <span key={p} className="px-1.5 py-0.5 bg-slate-700 text-slate-400 text-[10px] font-bold rounded hidden sm:inline">
                                                    {p}
                                                </span>
                                            ))}
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-[#ee626b] flex items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <p className="text-sm">Tidak ada produk ditemukan.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
