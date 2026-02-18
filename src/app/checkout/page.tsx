'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useData } from '@/lib/DataContext';
import { formatRupiah } from '@/lib/types';

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const { products } = useData();

  const product = products.find(p => p.id === productId);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setForm(prev => ({
            ...prev,
            customerName: data.user.name || '',
            customerEmail: data.user.email || '',
            customerPhone: data.user.phone || '',
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productId: product.id,
          productName: product.name,
          productPrice: product.salePrice || product.price,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Checkout gagal');
        return;
      }

      router.push(`/payment/${data.order.id}`);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-32">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Produk tidak ditemukan</h2>
          <p className="text-gray-400 mb-6">Produk yang kamu cari tidak tersedia</p>
          <a href="/shop" className="inline-block px-8 py-3 bg-[#ee626b] text-white font-semibold rounded-full hover:bg-[#d4555d] transition-colors">Kembali ke Shop</a>
        </div>
      </div>
    );
  }

  const displayPrice = product.salePrice || product.price;

  return (
    <section
      className="relative min-h-screen pt-32 pb-20"
      style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Checkout</h1>
            <p className="text-gray-300">Lengkapi data untuk melanjutkan pembelian</p>
          </div>

          {/* Main Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden">
            {/* Order Summary */}
            <div className="p-6 border-b border-white/10">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Ringkasan Pesanan</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-white/20">
                  <Image src={product.image} alt={product.name} width={80} height={80} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-lg truncate">{product.name}</h4>
                  <p className="text-sm text-gray-400">{product.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-[#ee626b]">{formatRupiah(displayPrice)}</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-6 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Nama Lengkap <span className="text-[#ee626b]">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/30 outline-none transition-all"
                  placeholder="Nama lengkap"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Email <span className="text-[#ee626b]">*</span>
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/30 outline-none transition-all"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Nomor WhatsApp <span className="text-[#ee626b]">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={form.customerPhone}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/30 outline-none transition-all"
                  placeholder="0859xxxxxxxx"
                  required
                />
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Akun game akan dikirim ke nomor WhatsApp ini
                </p>
              </div>

              {/* Total & Submit */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-200">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-white">{formatRupiah(displayPrice)}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-[#ee626b] text-white text-lg font-bold rounded-xl hover:bg-[#d4555d] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-[#ee626b]/25 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Lanjut ke Pembayaran
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Badge */}
          <div className="text-center mt-6 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Transaksi aman & terenkripsi
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#010101] pt-32">
          <div className="w-10 h-10 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <CheckoutForm />
      </Suspense>
      <Footer />
    </>
  );
}
