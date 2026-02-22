'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Review {
  id: number;
  productId: string;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  productName: string;
  productImage: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  image: string;
}

export default function AdminCommentsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [filterProduct, setFilterProduct] = useState('');

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [formUserId, setFormUserId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Customer search in form
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Quick create customer
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [createCustLoading, setCreateCustLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [reviewsRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);
      const [reviewsData, customersData, productsData] = await Promise.all([
        reviewsRes.json(),
        customersRes.json(),
        productsRes.json(),
      ]);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setEditingReview(null);
    setFormUserId('');
    setFormProductId('');
    setFormRating(5);
    setFormComment('');
    setFormError('');
    setCustomerSearch('');
    setProductSearch('');
    setShowModal(true);
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setFormUserId(String(review.userId));
    setFormProductId(review.productId);
    setFormRating(review.rating);
    setFormComment(review.comment);
    setFormError('');
    setCustomerSearch('');
    setProductSearch('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId || !formProductId || !formComment.trim()) {
      setFormError('Semua field wajib diisi');
      return;
    }
    setFormLoading(true);
    setFormError('');

    try {
      if (editingReview) {
        // Update
        const res = await fetch(`/api/admin/reviews/${editingReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: formUserId,
            productId: formProductId,
            rating: formRating,
            comment: formComment.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Gagal update');
          return;
        }
        // Refresh data
        await fetchData();
      } else {
        // Create
        const res = await fetch('/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: formUserId,
            productId: formProductId,
            rating: formRating,
            comment: formComment.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Gagal menambah review');
          return;
        }
        setReviews(prev => [data, ...prev]);
      }
      setShowModal(false);
    } catch {
      setFormError('Terjadi kesalahan jaringan');
    } finally {
      setFormLoading(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    if (!confirm('Hapus review ini?')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        alert('Gagal menghapus review');
      }
    } catch {
      alert('Gagal menghapus review');
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    setCreateCustLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustName.trim(), email: newCustEmail.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers(prev => [{ id: data.id, name: data.name, email: data.email }, ...prev]);
        setFormUserId(String(data.id));
        setCustomerSearch(data.name);
        setShowCreateCustomer(false);
        setNewCustName('');
        setNewCustEmail('');
      } else {
        alert(data.error || 'Gagal membuat customer');
      }
    } catch {
      alert('Gagal membuat customer');
    } finally {
      setCreateCustLoading(false);
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter(r => {
    if (filterRating > 0 && r.rating !== filterRating) return false;
    if (filterProduct && r.productId !== filterProduct) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (
        r.userName?.toLowerCase().includes(s) ||
        r.comment?.toLowerCase().includes(s) ||
        r.productName?.toLowerCase().includes(s) ||
        r.userEmail?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  // Filter selections for customer/product in form
  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
  });

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    return p.name.toLowerCase().includes(productSearch.toLowerCase());
  });

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : '0';
  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({ rating: r, count: reviews.filter(rv => rv.rating === r).length }));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderStars = (rating: number, size = 14) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
          fill={i <= rating ? '#f59e0b' : 'none'}
          stroke={i <= rating ? '#f59e0b' : '#475569'}
          strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );

  const renderClickableStars = (rating: number, onChange: (r: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)}
          className="transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width={28} height={28} viewBox="0 0 24 24"
            fill={i <= rating ? '#f59e0b' : 'none'}
            stroke={i <= rating ? '#f59e0b' : '#475569'}
            strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Comments / Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">Kelola ulasan customer pada setiap game</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors shadow-lg shadow-[#ee626b]/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Tambah Review
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalReviews}</p>
              <p className="text-xs text-slate-400">Total Review</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{avgRating}</p>
              <p className="text-xs text-slate-400">Rata-rata</p>
            </div>
          </div>
        </div>
        {ratingCounts.slice(0, 2).map(rc => (
          <div key={rc.rating} className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                <span className="text-amber-400 font-bold text-sm">{rc.rating}★</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{rc.count}</p>
                <p className="text-xs text-slate-400">{rc.rating} Bintang</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text" placeholder="Cari nama, email, game, komentar..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#ee626b] transition-colors"
          />
        </div>
        <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}
          className="px-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-[#ee626b] transition-colors min-w-[140px]">
          <option value={0}>Semua Rating</option>
          {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Bintang</option>)}
        </select>
        <select value={filterProduct} onChange={(e) => setFilterProduct(e.target.value)}
          className="px-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-[#ee626b] transition-colors min-w-[180px] max-w-[250px]">
          <option value="">Semua Game</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-slate-600 mb-4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-slate-400">{searchTerm || filterRating || filterProduct ? 'Tidak ada review yang cocok' : 'Belum ada review'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-[#1e293b] rounded-2xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                  {review.productImage ? (
                    <Image src={review.productImage} alt={review.productName || ''} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{review.userName}</span>
                        <span className="text-slate-500 text-xs">•</span>
                        <span className="text-slate-400 text-xs">{review.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#ee626b] text-xs font-medium px-2 py-0.5 rounded-lg bg-[#ee626b]/10 truncate max-w-[200px]">
                          {review.productName || review.productId}
                        </span>
                        {renderStars(review.rating)}
                        <span className="text-xs text-slate-500">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEditModal(review)}
                        className="p-2 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => deleteReview(review.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Hapus">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-slate-300 text-sm mt-2 leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#1e293b] rounded-2xl shadow-2xl w-full max-w-lg border border-slate-700/50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#1e293b] p-6 pb-4 border-b border-slate-700/50 z-10">
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <h3 className="text-lg font-bold text-white">{editingReview ? 'Edit Review' : 'Tambah Review'}</h3>
              <p className="text-slate-400 text-sm">{editingReview ? 'Ubah data review' : 'Buat review baru untuk game tertentu'}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-xl text-sm bg-red-500/10 border border-red-500/30 text-red-400">{formError}</div>
              )}

              {/* Customer selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-300">Customer</label>
                  <button type="button" onClick={() => { setShowCreateCustomer(true); setNewCustName(''); setNewCustEmail(''); }}
                    className="text-xs text-[#ee626b] hover:text-[#d4555d] font-medium">
                    + Buat Customer Baru
                  </button>
                </div>
                <input type="text" placeholder="Cari customer..." value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full h-10 px-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-[#ee626b] focus:outline-none text-sm mb-2" />
                <div className="max-h-36 overflow-y-auto bg-slate-800/50 rounded-xl border border-slate-700/50">
                  {filteredCustomers.slice(0, 50).map(c => (
                    <button key={c.id} type="button"
                      onClick={() => { setFormUserId(String(c.id)); setCustomerSearch(c.name); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors ${String(c.id) === formUserId ? 'bg-[#ee626b]/10 border-l-2 border-[#ee626b]' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate">{c.name}</p>
                        <p className="text-slate-500 text-xs truncate">{c.email}</p>
                      </div>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-3">Tidak ada customer ditemukan</p>
                  )}
                </div>
                {formUserId && (
                  <p className="text-xs text-green-400 mt-1">
                    Dipilih: {customers.find(c => String(c.id) === formUserId)?.name || `ID ${formUserId}`}
                  </p>
                )}
              </div>

              {/* Product selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Game / Produk</label>
                <input type="text" placeholder="Cari game..." value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-10 px-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-[#ee626b] focus:outline-none text-sm mb-2" />
                <div className="max-h-36 overflow-y-auto bg-slate-800/50 rounded-xl border border-slate-700/50">
                  {filteredProducts.slice(0, 30).map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setFormProductId(p.id); setProductSearch(p.name); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-700/50 transition-colors ${p.id === formProductId ? 'bg-[#ee626b]/10 border-l-2 border-[#ee626b]' : ''}`}>
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                        {p.image ? (
                          <Image src={p.image} alt={p.name} width={36} height={36} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">?</div>
                        )}
                      </div>
                      <p className="text-white text-sm truncate">{p.name}</p>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-3">Tidak ada game ditemukan</p>
                  )}
                </div>
                {formProductId && (
                  <p className="text-xs text-green-400 mt-1">
                    Dipilih: {products.find(p => p.id === formProductId)?.name || formProductId}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                {renderClickableStars(formRating, setFormRating)}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Komentar</label>
                <textarea value={formComment} onChange={(e) => setFormComment(e.target.value)}
                  rows={3} placeholder="Tulis komentar review..."
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-[#ee626b] focus:outline-none text-sm resize-none" required />
              </div>

              <button type="submit" disabled={formLoading}
                className="w-full h-11 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors disabled:opacity-50">
                {formLoading ? 'Menyimpan...' : editingReview ? 'Simpan Perubahan' : 'Tambah Review'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Customer Modal */}
      {showCreateCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateCustomer(false)} />
          <div className="relative bg-[#1e293b] rounded-2xl p-6 shadow-2xl w-full max-w-sm border border-slate-700/50">
            <button onClick={() => setShowCreateCustomer(false)} className="absolute top-3 right-3 p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
            <h3 className="text-lg font-bold text-white mb-1">Buat Customer Baru</h3>
            <p className="text-slate-400 text-sm mb-4">Customer baru akan langsung tersedia untuk dipilih</p>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama</label>
                <input type="text" value={newCustName} onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Nama customer" required
                  className="w-full h-11 px-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-[#ee626b] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email <span className="text-slate-500">(opsional)</span></label>
                <input type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="Kosongkan = auto generate"
                  className="w-full h-11 px-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-[#ee626b] focus:outline-none" />
              </div>
              <button type="submit" disabled={createCustLoading}
                className="w-full h-11 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors disabled:opacity-50">
                {createCustLoading ? 'Membuat...' : 'Buat Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
