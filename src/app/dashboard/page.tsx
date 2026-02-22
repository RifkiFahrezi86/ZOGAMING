'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah } from '@/lib/types';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Preloader from '@/components/ui/Preloader';

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  processing: {
    label: 'Diproses',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>,
  },
  complete: {
    label: 'Selesai',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  },
};

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders?status=${filter}`);
      const data = await res.json();
      setOrders(data);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
      return;
    }
    if (user) fetchOrders();
  }, [user, authLoading, router, fetchOrders]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Yakin ingin membatalkan pesanan ini? Pesanan yang dibatalkan tidak bisa dikembalikan.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal membatalkan pesanan');
        return;
      }
      fetchOrders();
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Yakin ingin menghapus pesanan ini dari daftar? Data pesanan akan dihapus permanen.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}?action=delete`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menghapus pesanan');
        return;
      }
      fetchOrders();
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMessage('');

    if (newPassword !== confirmPassword) {
      setPwError('Konfirmasi password tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Password baru minimal 6 karakter');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Gagal mengubah password');
      } else {
        setPwMessage('Password berhasil diubah!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => { setShowChangePassword(false); setPwMessage(''); }, 2000);
      }
    } catch {
      setPwError('Terjadi kesalahan jaringan');
    } finally {
      setPwLoading(false);
    }
  };

  if (authLoading || !user) return <Preloader />;

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completeCount = orders.filter(o => o.status === 'complete').length;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* User Info Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ee626b] to-[#d4555d] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/shop" className="px-4 py-2 bg-[#ee626b] text-white text-sm font-semibold rounded-xl hover:bg-[#d4555d] transition-colors">
                Belanja
              </Link>
              <button onClick={() => setShowChangePassword(true)} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Ubah Password
              </button>
              <button onClick={handleLogout} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Keluar
              </button>
            </div>
          </div>

          {/* Change Password Modal */}
          {showChangePassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowChangePassword(false); setPwError(''); setPwMessage(''); }} />
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md">
                <button onClick={() => { setShowChangePassword(false); setPwError(''); setPwMessage(''); }} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Ubah Password</h3>
                
                {pwMessage && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{pwMessage}</div>
                )}
                {pwError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{pwError}</div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Lama</label>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Masukkan password lama" className="w-full h-11 px-4 border border-gray-200 rounded-xl text-gray-900 focus:border-[#ee626b] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="w-full h-11 px-4 border border-gray-200 rounded-xl text-gray-900 focus:border-[#ee626b] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" className="w-full h-11 px-4 border border-gray-200 rounded-xl text-gray-900 focus:border-[#ee626b] focus:outline-none" required />
                  </div>
                  <button type="submit" disabled={pwLoading} className="w-full h-11 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors disabled:opacity-50">
                    {pwLoading ? 'Memproses...' : 'Ubah Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-xs text-gray-500">Total Pesanan</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-gray-500">Menunggu</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-green-600">{completeCount}</p>
              <p className="text-xs text-gray-500">Selesai</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'pending', label: 'Menunggu' },
              { key: 'processing', label: 'Diproses' },
              { key: 'complete', label: 'Selesai' },
              { key: 'cancelled', label: 'Dibatalkan' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.key 
                    ? 'bg-[#ee626b] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto text-[#ee626b]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <p className="text-gray-400 mt-3">Memuat pesanan...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="mx-auto mb-4"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Pesanan</h2>
              <p className="text-gray-500 mb-4">Yuk mulai belanja game favoritmu!</p>
              <Link href="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-[#ee626b] text-white font-semibold rounded-full hover:bg-[#d4555d] transition-colors">
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const isExpanded = expandedOrder === order.id;
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex-shrink-0">
                        {order.items[0]?.productImage ? (
                          <div className="w-14 h-14 rounded-xl overflow-hidden">
                            <Image src={order.items[0].productImage} alt="" width={56} height={56} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-900">Order #{order.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {order.items.map(i => i.productName).join(', ')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">{formatRupiah(order.total)}</p>
                        <p className="text-xs text-gray-400">{order.items.length} produk</p>
                      </div>

                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-5">
                        <div className="space-y-3 mb-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image src={item.productImage} alt={item.productName} width={48} height={48} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">{formatRupiah(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Status Info */}
                        {order.status === 'pending' && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                            <p className="text-sm font-semibold text-amber-800 mb-1">Menunggu Pembayaran</p>
                            <p className="text-xs text-amber-700">Silakan hubungi Admin melalui WhatsApp untuk konfirmasi pembayaran dan menerima akun game.</p>
                          </div>
                        )}
                        {order.status === 'processing' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <p className="text-sm font-semibold text-blue-800 mb-1">Pesanan Sedang Diproses</p>
                            <p className="text-xs text-blue-700">Admin sedang menyiapkan akun game kamu. Mohon tunggu sebentar ya!</p>
                          </div>
                        )}
                        {order.status === 'complete' && (
                          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                            <p className="text-sm font-semibold text-green-800 mb-1">Pesanan Selesai!</p>
                            <p className="text-xs text-green-700">Akun dan password sudah dikirim melalui WhatsApp. Selamat bermain!</p>
                          </div>
                        )}

                        {order.notes && (
                          <div className="text-sm">
                            <span className="text-gray-500">Catatan: </span>
                            <span className="text-gray-700">{order.notes}</span>
                          </div>
                        )}

                        <div className="border-t mt-4 pt-4 flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-900">Total: {formatRupiah(order.total)}</span>
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"
                              >
                                Batalkan Pesanan
                              </button>
                            )}
                            {(order.status === 'complete' || order.status === 'cancelled') && (
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Hapus Pesanan
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
