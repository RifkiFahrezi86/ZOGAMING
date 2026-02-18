'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatRupiah } from '@/lib/types';

interface PaymentMethodData {
  id: string;
  method: string;
  label: string;
  qrisImage: string | null;
  bankName: string | null;
  vaNumber: string | null;
  accountName: string | null;
  gopayNumber: string | null;
  gopayName: string | null;
  instructions: string | null;
}

interface OrderData {
  id: string;
  orderNumber: string;
  productName: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentExpiry: string;
  paymentMethod: string | null;
}

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const loadPaymentData = useCallback(async () => {
    try {
      const res = await fetch(`/api/payments?orderId=${orderId}`);
      const data = await res.json();
      if (!res.ok) {
        if (data.expired) {
          setError('Pembayaran sudah expired. Silakan buat order baru.');
        } else {
          setError(data.error || 'Gagal memuat data');
        }
        return;
      }
      setOrder(data.order);
      setPaymentMethods(data.paymentMethods);
      if (data.order.paymentMethod) {
        setSelectedMethod(data.order.paymentMethod);
      }
    } catch {
      setError('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

  useEffect(() => {
    if (!order?.paymentExpiry) return;
    const updateTimer = () => {
      const expiry = new Date(order.paymentExpiry).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && order.paymentStatus !== 'SUCCESS') {
        setError('Pembayaran sudah expired');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectMethod = async (method: string) => {
    setSelectedMethod(method);
    try {
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod: method, action: 'select_method' }),
      });
    } catch { /* silent */ }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) {
      setError('Pilih metode pembayaran terlebih dahulu');
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action: 'confirm_payment' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal konfirmasi pembayaran');
        return;
      }
      setConfirmed(true);
    } catch {
      setError('Terjadi kesalahan');
    } finally {
      setConfirming(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qris':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" />
            <rect x="18" y="18" width="3" height="3" />
          </svg>
        );
      case 'va':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'gopay':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 border-4 border-[#ee626b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Memuat halaman pembayaran...</p>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  if (confirmed) {
    return (
      <>
        <Header />
        <section className="relative min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
          <div className="relative z-10 max-w-md mx-4 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-10">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Konfirmasi Terkirim!</h2>
              <p className="text-gray-300 mb-2">
                Order <span className="font-bold text-white">{order?.orderNumber}</span> sedang menunggu verifikasi admin.
              </p>
              <p className="text-gray-400 mb-8 text-sm">
                Anda akan menerima notifikasi WhatsApp setelah pembayaran diverifikasi.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/order-status/${orderId}`)}
                  className="w-full h-12 bg-[#ee626b] text-white font-semibold rounded-xl hover:bg-[#d4555d] transition-colors"
                >
                  Cek Status Pesanan
                </button>
                <button
                  onClick={() => router.push('/shop')}
                  className="w-full h-12 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Kembali ke Shop
                </button>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/page-heading-bg.jpg)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />
        <div className="relative z-10 container mx-auto px-4 py-16 pt-32">
          <div className="max-w-2xl mx-auto">
            {/* Timer */}
            {timeLeft > 0 && (
              <div className={`text-center mb-6 p-4 rounded-xl backdrop-blur-sm ${timeLeft < 300 ? 'bg-red-500/20 border border-red-500/30' : 'bg-yellow-500/20 border border-yellow-500/30'}`}>
                <p className="text-sm text-gray-300 mb-1">Selesaikan pembayaran dalam</p>
                <p className={`text-3xl font-bold ${timeLeft < 300 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {formatTime(timeLeft)}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm">
                {error}
                {error.includes('expired') && (
                  <button onClick={() => router.push('/shop')} className="block mt-2 text-[#ee626b] font-semibold hover:underline">
                    Kembali ke Shop →
                  </button>
                )}
              </div>
            )}

            {order && (
              <>
                {/* Order Info */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white text-lg">{order.orderNumber}</h3>
                      <p className="text-gray-400 text-sm">{order.productName}</p>
                    </div>
                    <span className="text-2xl font-bold text-[#ee626b]">{formatRupiah(order.total)}</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <h3 className="text-xl font-bold text-white mb-4">Pilih Metode Pembayaran</h3>
                
                <div className="space-y-4 mb-8">
                  {paymentMethods.map((pm) => (
                    <button
                      key={pm.method}
                      onClick={() => handleSelectMethod(pm.method)}
                      className={`w-full p-5 rounded-2xl border-2 text-left transition-all backdrop-blur-sm ${
                        selectedMethod === pm.method
                          ? 'border-[#ee626b] bg-[#ee626b]/10'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          selectedMethod === pm.method ? 'bg-[#ee626b] text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          {getMethodIcon(pm.method)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-white">{pm.label}</h4>
                          {pm.instructions && (
                            <p className="text-sm text-gray-400 mt-1">{pm.instructions}</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedMethod === pm.method ? 'border-[#ee626b] bg-[#ee626b]' : 'border-gray-500'
                        }`}>
                          {selectedMethod === pm.method && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {selectedMethod === pm.method && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          {pm.method === 'qris' && pm.qrisImage && (
                            <div className="text-center">
                              <img src={pm.qrisImage} alt="QRIS" className="w-48 h-48 mx-auto rounded-xl bg-white p-2" />
                              <p className="text-sm text-gray-400 mt-2">Scan QR code di atas untuk membayar</p>
                            </div>
                          )}
                          {pm.method === 'va' && (
                            <div className="space-y-2">
                              {pm.bankName && <p className="text-sm"><span className="text-gray-400">Bank:</span> <span className="font-semibold text-white">{pm.bankName}</span></p>}
                              {pm.vaNumber && <p className="text-sm"><span className="text-gray-400">No. VA:</span> <span className="font-bold text-lg text-white">{pm.vaNumber}</span></p>}
                              {pm.accountName && <p className="text-sm"><span className="text-gray-400">Atas Nama:</span> <span className="font-semibold text-white">{pm.accountName}</span></p>}
                            </div>
                          )}
                          {pm.method === 'gopay' && (
                            <div className="space-y-2">
                              {pm.gopayNumber && <p className="text-sm"><span className="text-gray-400">No. GoPay:</span> <span className="font-bold text-lg text-white">{pm.gopayNumber}</span></p>}
                              {pm.gopayName && <p className="text-sm"><span className="text-gray-400">Atas Nama:</span> <span className="font-semibold text-white">{pm.gopayName}</span></p>}
                            </div>
                          )}
                          <div className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                            <p className="text-xs text-yellow-300">
                              💰 Transfer tepat <span className="font-bold text-yellow-200">{formatRupiah(order.total)}</span> agar pembayaran terverifikasi otomatis.
                            </p>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}

                  {paymentMethods.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>Belum ada metode pembayaran yang dikonfigurasi.</p>
                      <p className="text-sm mt-1">Hubungi admin untuk informasi pembayaran.</p>
                    </div>
                  )}
                </div>

                {/* Confirm Button */}
                {selectedMethod && timeLeft > 0 && (
                  <button
                    onClick={handleConfirmPayment}
                    disabled={confirming}
                    className="w-full h-14 bg-[#ee626b] text-white text-lg font-bold rounded-xl hover:bg-[#d4555d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-[#ee626b]/30"
                  >
                    {confirming ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Mengkonfirmasi...
                      </span>
                    ) : 'Saya Sudah Bayar'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
