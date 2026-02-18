'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  // Try to load user info
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

      // Redirect to payment page
      router.push(`/payment/${data.order.id}`);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produk tidak ditemukan</h2>
          <a href="/shop" className="btn-primary">Kembali ke Shop</a>
        </div>
      </div>
    );
  }

  const displayPrice = product.salePrice || product.price;

  return (
    <section className="container mx-auto px-4 py-16 pt-32">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h2>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Ringkasan Pesanan</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-xl overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{product.name}</h4>
              <p className="text-sm text-gray-500">{product.category}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#ee626b]">{formatRupiah(displayPrice)}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/20 outline-none transition-all"
              placeholder="Nama lengkap"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="customerEmail"
              value={form.customerEmail}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/20 outline-none transition-all"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={form.customerPhone}
              onChange={handleChange}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#ee626b] focus:ring-2 focus:ring-[#ee626b]/20 outline-none transition-all"
              placeholder="0859xxxxxxxx"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Akun akan dikirim ke nomor WhatsApp ini</p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-gray-900">Total Pembayaran</span>
              <span className="text-2xl font-bold text-[#ee626b]">{formatRupiah(displayPrice)}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-[#ee626b] text-white text-lg font-bold rounded-xl hover:bg-[#d4555d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Memproses...' : 'Lanjut ke Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-32"><p>Loading...</p></div>}>
        <CheckoutForm />
      </Suspense>
      <Footer />
    </>
  );
}
