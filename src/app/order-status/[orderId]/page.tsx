'use client';

import { useState, useEffect, use } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatRupiah } from '@/lib/types';
import Link from 'next/link';

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productPrice: number;
  quantity: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  accountEmail: string | null;
  accountPassword: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Menunggu Pembayaran', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '⏳' },
  PROCESSING: { label: 'Sedang Diproses', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🔄' },
  COMPLETED: { label: 'Selesai', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '✅' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '❌' },
};

export default function OrderStatusPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Order tidak ditemukan');
          return;
        }
        setOrder(data.order);
      } catch {
        setError('Gagal memuat data');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Header />
        <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
          <div className="relative z-10">
            <div className="w-12 h-12 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin" />
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Header />
        <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
          <div className="relative z-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">{error || 'Order tidak ditemukan'}</h2>
            <Link href="/shop" className="px-6 py-3 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors">
              Kembali ke Shop
            </Link>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;

  return (
    <>
      <Header />
      <section className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        <div className="relative z-10 container mx-auto px-4 py-16 pt-32">
          <div className="max-w-2xl mx-auto">
            {/* Status Header */}
            <div className="text-center mb-10">
              <div className="text-5xl mb-4">{status.icon}</div>
              <h2 className="text-3xl font-bold text-white mb-3">Status Pesanan</h2>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Order Progress */}
            <div className="flex items-center justify-between mb-10 px-4">
              {['PENDING', 'PROCESSING', 'COMPLETED'].map((step, i) => {
                const steps = ['PENDING', 'PROCESSING', 'COMPLETED'];
                const currentIndex = steps.indexOf(order.status);
                const isActive = i <= currentIndex && order.status !== 'CANCELLED';
                const isCancelled = order.status === 'CANCELLED';
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isCancelled ? 'bg-red-500/30 text-red-400' :
                      isActive ? 'bg-[#ee626b] text-white' : 'bg-white/10 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    {i < 2 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        isCancelled ? 'bg-red-500/30' :
                        i < currentIndex ? 'bg-[#ee626b]' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mb-10 px-2 text-xs text-gray-400">
              <span>Pembayaran</span>
              <span>Diproses</span>
              <span>Selesai</span>
            </div>

            {/* Order Details */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID</span>
                <span className="font-bold text-white">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Produk</span>
                <span className="font-semibold text-white">{order.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-[#ee626b]">{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Metode Pembayaran</span>
                <span className="font-semibold text-white uppercase">{order.paymentMethod || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tanggal</span>
                <span className="font-semibold text-white">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Account Details (if delivered) */}
            {order.status === 'COMPLETED' && order.accountEmail && (
              <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-bold text-green-400 mb-4">🎮 Detail Akun Anda</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-400/70">Email</span>
                    <span className="font-mono font-bold text-white">{order.accountEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-400/70">Password</span>
                    <span className="font-mono font-bold text-white">{order.accountPassword}</span>
                  </div>
                </div>
                <p className="text-xs text-green-400/60 mt-4">⚠️ Segera ubah password setelah login!</p>
              </div>
            )}

            {/* Processing notice */}
            {order.status === 'PROCESSING' && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-bold text-blue-400 mb-2">⏳ Pesanan Sedang Diproses</h3>
                <p className="text-blue-300/80 text-sm">
                  Admin sedang memproses pesanan Anda. Estimasi maksimal 30 menit.
                </p>
                <p className="text-blue-300/60 text-xs mt-2">
                  Jika lebih dari 30 menit pesanan belum diterima, uang akan dikembalikan secara otomatis.
                </p>
              </div>
            )}

            {/* Back to shop */}
            <div className="mt-8 text-center">
              <Link href="/shop" className="text-[#ee626b] font-semibold hover:underline">
                ← Kembali ke Shop
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
